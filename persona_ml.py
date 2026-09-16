import os
import re
import zipfile
import subprocess
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class PersonaMLEngine:
    def __init__(self, target_name):
        self.target_name = target_name
        self.chat_pairs = []
        self.word_vec = None
        self.char_vec = None
        self.word_matrix = None
        self.char_matrix = None
        self.df = pd.DataFrame()
        self.corpus_file = f"corpus_{target_name.lower().replace(' ', '_')}.txt"

    def parse_chat_file(self, file_path):
        """
        Parses WhatsApp export .txt or .zip file or raw text
        """
        raw_text = ""
        if file_path.endswith('.zip'):
            with zipfile.ZipFile(file_path, 'r') as z:
                txt_files = [f for f in z.namelist() if f.lower().endswith('.txt')]
                if txt_files:
                    target = [f for f in txt_files if '_chat.txt' in f.lower()] or txt_files
                    raw_text = z.read(target[0]).decode('utf-8', errors='ignore')
        else:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                raw_text = f.read()

        return self.parse_raw_text(raw_text)

    def parse_raw_text(self, raw_text):
        lines = raw_text.splitlines()
        messages = []
        
        wa_std = re.compile(r'^\d{1,2}/\d{1,2}/\d{2,4},\s*\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?\s*-\s*([^:]+):\s*(.*)$', re.I)
        wa_bracket = re.compile(r'^\[\d{1,2}/\d{1,2}/\d{2,4},\s*\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?\]\s*([^:]+):\s*(.*)$', re.I)
        colon_std = re.compile(r'^([A-Z0-9_\s]{2,25}):\s*(.*)$', re.I)

        curr = None
        for line in lines:
            line = line.strip()
            if not line or 'end-to-end encrypted' in line:
                continue

            m = wa_std.match(line) or wa_bracket.match(line) or colon_std.match(line)
            if m:
                sender = m.group(1).strip()
                text = m.group(2).strip()
                if text and text not in ['<Media omitted>', '‎image omitted', '‎video omitted']:
                    curr = {'sender': sender, 'text': text}
                    messages.append(curr)
            elif curr:
                curr['text'] += ' ' + line

        return messages

    def train(self, messages):
        """
        Extracts dialogue turn pairs and trains Python Scikit-Learn ML models + exports C++ corpus.
        """
        turn_pairs = []
        for i in range(len(messages) - 1):
            c_msg = messages[i]
            n_msg = messages[i + 1]

            if c_msg['sender'].lower() != self.target_name.lower() and n_msg['sender'].lower() == self.target_name.lower():
                turn_pairs.append({
                    'context': c_msg['text'].strip(),
                    'response': n_msg['text'].strip()
                })

        if not turn_pairs:
            target_texts = [m['text'] for m in messages if m['sender'].lower() == self.target_name.lower()]
            for i in range(len(target_texts) - 1):
                turn_pairs.append({
                    'context': target_texts[i],
                    'response': target_texts[i+1]
                })

        if not turn_pairs:
            return False

        self.df = pd.DataFrame(turn_pairs)
        self.chat_pairs = turn_pairs

        # 1. Scikit-Learn Word Vectorizer
        self.word_vec = TfidfVectorizer(ngram_range=(1, 3), sublinear_tf=True)
        self.word_matrix = self.word_vec.fit_transform(self.df['context'])

        # 2. Scikit-Learn Character N-Gram Subword Vectorizer (Hinglish phonetic matcher)
        self.char_vec = TfidfVectorizer(analyzer='char_wb', ngram_range=(2, 5), sublinear_tf=True)
        self.char_matrix = self.char_vec.fit_transform(self.df['context'])

        # 3. Export C++ Corpus for C++ Engine
        with open(self.corpus_file, 'w', encoding='utf-8') as f:
            for pair in turn_pairs:
                clean_ctx = pair['context'].replace('\n', ' ').replace('\t', ' ')
                clean_res = pair['response'].replace('\n', ' ').replace('\t', ' ')
                f.write(f"{clean_ctx}\t{clean_res}\n")

        return True

    def generate_reply(self, user_message, use_cpp=True):
        """
        Generates ML reply using C++ native engine or Python Scikit-Learn
        """
        if self.df.empty:
            return "Haa 🥲"

        user_input = user_message.strip()
        if not user_input:
            return "..."

        # Try C++ Native Engine Execution
        if use_cpp and os.path.exists("cpp_engine.exe") and os.path.exists(self.corpus_file):
            try:
                res = subprocess.run(
                    ["cpp_engine.exe", user_input, self.corpus_file],
                    capture_output=True,
                    text=True,
                    timeout=3
                )
                output = res.stdout
                for line in output.splitlines():
                    if line.startswith("RESPONSE:"):
                        cpp_reply = line.replace("RESPONSE:", "").strip()
                        if cpp_reply:
                            return cpp_reply
            except Exception as e:
                print("C++ Engine fallback to Python ML:", e)

        # Python Scikit-Learn TF-IDF Cosine Similarity Fallback
        q_word = self.word_vec.transform([user_input])
        q_char = self.char_vec.transform([user_input])

        word_sims = cosine_similarity(q_word, self.word_matrix).flatten()
        char_sims = cosine_similarity(q_char, self.char_matrix).flatten()

        hybrid_scores = 0.5 * word_sims + 0.5 * char_sims
        top_idx = np.argmax(hybrid_scores)

        if hybrid_scores[top_idx] > 0.02:
            return self.df.iloc[top_idx]['response']

        # Random fallback from real messages
        return self.df.sample(1).iloc[0]['response']
