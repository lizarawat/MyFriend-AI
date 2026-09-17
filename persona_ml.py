import os
import re
import zipfile
import subprocess
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Pre-trained Base Foundation Models across Age Demographics
DEMOGRAPHIC_BASE_MODELS = {
    "gen_z": {
        "title": "Gen-Z / Youth Texting (13-24)",
        "slang_keywords": ["fr", "ngl", "deadass", "bet", "vibe", "slay", "bruh", "lowkey", "idk", "wbu", "rn", "tbh", "idc", "skibidi", "rizz", "💀", "😭", "🥲"],
        "greetings": ["yo!", "wassup", "oiee", "hey bro", "sup"],
        "fallbacks": ["deadass fr 💀", "idk man lowkey chilling 🥲", "lmao no way", "haa valid point ngl", "bet bro"],
        "prompt_style": "Types casually, relies on lowercase, uses Gen-Z internet slang and emojis like 💀, 😭, 🥲."
    },
    "millennial": {
        "title": "Millennial / Young Adult (25-35)",
        "slang_keywords": ["lol", "lmao", "haha", "hahaha", "yeah", "cool", "awesome", "nice", "sweet", "cheers", "tbh", "😂", "👍"],
        "greetings": ["hey!", "hello!", "yo yo", "good morning", "wassup!"],
        "fallbacks": ["haha yeah for real 😂", "nice, sounds pretty cool!", "lol true that", "yeah totally agree 👍", "let's see how it goes!"],
        "prompt_style": "Friendly conversational style, uses laugh words (haha, lol) and standard punctuation."
    },
    "adult_elder": {
        "title": "Adult / Formal Communicator (36+)",
        "slang_keywords": ["regards", "dear", "thanks", "thank you", "hope you are well", "take care", "good morning", "blessings", "pls", "please", "😊", "🙏"],
        "greetings": ["Good morning!", "Hello", "Hi there", "Hope you are doing well."],
        "fallbacks": ["That sounds great. Take care!", "Thank you for updating me.", "Indeed, let us speak soon.", "Hope everything goes well! 😊"],
        "prompt_style": "Formal, structured sentences, uses full punctuation, capitalizes first letters, polite tone."
    }
}

class PersonaMLEngine:
    def __init__(self, target_name):
        self.target_name = target_name
        self.chat_pairs = []
        self.word_vec = None
        self.char_vec = None
        self.word_matrix = None
        self.char_matrix = None
        self.df = pd.DataFrame()
        self.demographic_group = "millennial"
        self.demographic_info = DEMOGRAPHIC_BASE_MODELS["millennial"]
        self.corpus_file = f"corpus_{target_name.lower().replace(' ', '_')}.txt"

    def parse_chat_file(self, file_path):
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

    def classify_demographic_age_group(self, target_texts):
        """
        Classifies persona into Age Group Demographics (Gen-Z, Millennial, Adult/Elder)
        using internet texting feature scores.
        """
        genz_score = 0
        millennial_score = 0
        adult_score = 0

        combined = " ".join(target_texts).lower()

        for kw in DEMOGRAPHIC_BASE_MODELS["gen_z"]["slang_keywords"]:
            genz_score += combined.count(kw)

        for kw in DEMOGRAPHIC_BASE_MODELS["millennial"]["slang_keywords"]:
            millennial_score += combined.count(kw)

        for kw in DEMOGRAPHIC_BASE_MODELS["adult_elder"]["slang_keywords"]:
            adult_score += combined.count(kw)

        total_msgs = len(target_texts) or 1
        lower_count = sum(1 for t in target_texts if t == t.lower())
        full_punct_count = sum(1 for t in target_texts if t.endswith('.') or t.endswith('!'))

        if lower_count / total_msgs > 0.6 or genz_score >= millennial_score:
            self.demographic_group = "gen_z"
        elif full_punct_count / total_msgs > 0.5 or adult_score > millennial_score:
            self.demographic_group = "adult_elder"
        else:
            self.demographic_group = "millennial"

        self.demographic_info = DEMOGRAPHIC_BASE_MODELS[self.demographic_group]
        return self.demographic_info

    def train(self, messages):
        """
        Extracts dialogue turn pairs, computes demographic classification, and trains ML models.
        """
        target_texts = [m['text'] for m in messages if m['sender'].lower() == self.target_name.lower()]
        self.classify_demographic_age_group(target_texts)

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

        # 2. Scikit-Learn Character N-Gram Subword Vectorizer
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
        if self.df.empty:
            return np.random.choice(self.demographic_info["fallbacks"])

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
                pass

        # Python Scikit-Learn TF-IDF Cosine Similarity Search
        q_word = self.word_vec.transform([user_input])
        q_char = self.char_vec.transform([user_input])

        word_sims = cosine_similarity(q_word, self.word_matrix).flatten()
        char_sims = cosine_similarity(q_char, self.char_matrix).flatten()

        hybrid_scores = 0.5 * word_sims + 0.5 * char_sims
        top_idx = np.argmax(hybrid_scores)

        if hybrid_scores[top_idx] > 0.03:
            return self.df.iloc[top_idx]['response']

        # Fallback to Demographic Foundation Base Model
        return np.random.choice(self.demographic_info["fallbacks"])
