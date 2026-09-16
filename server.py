import os
import re
import json
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
CORS(app)

# Global dictionary storing trained Python ML models per persona ID
# Models store: word_vectorizer, char_vectorizer, word_matrix, char_matrix, df, recent_responses
PERSONA_MODELS = {}

def parse_raw_chat(raw_text):
    """
    Parses raw text export into a structured list of messages.
    """
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
            curr['text'] += '\n' + line
            
    return messages

def train_persona_ml_model(messages, target_person):
    """
    Trains Scikit-Learn TF-IDF Word & Char N-Gram models on conversation turn pairs.
    """
    turn_pairs = []
    
    for i in range(len(messages) - 1):
        curr_msg = messages[i]
        next_msg = messages[i + 1]
        
        if curr_msg['sender'].lower() != target_person.lower() and next_msg['sender'].lower() == target_person.lower():
            turn_pairs.append({
                'context': curr_msg['text'].strip(),
                'response': next_msg['text'].strip()
            })
            
    if not turn_pairs:
        # Fallback: pair consecutive target person messages or use single texts
        target_texts = [m['text'] for m in messages if m['sender'].lower() == target_person.lower()]
        for i in range(len(target_texts) - 1):
            turn_pairs.append({
                'context': target_texts[i],
                'response': target_texts[i+1]
            })

    if not turn_pairs:
        return None

    df = pd.DataFrame(turn_pairs)
    
    # 1. Word-level TF-IDF Vectorizer (1-3 ngrams)
    word_vec = TfidfVectorizer(ngram_range=(1, 3), sublinear_tf=True)
    word_matrix = word_vec.fit_transform(df['context'])

    # 2. Character-level TF-IDF Vectorizer for Hinglish & noisy spellings (2-5 ngrams)
    char_vec = TfidfVectorizer(analyzer='char_wb', ngram_range=(2, 5), sublinear_tf=True)
    char_matrix = char_vec.fit_transform(df['context'])

    return {
        'word_vectorizer': word_vec,
        'word_matrix': word_matrix,
        'char_vectorizer': char_vec,
        'char_matrix': char_matrix,
        'df': df,
        'recent_responses': []
    }

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': 'Python ML Persona Engine is running!'})

@app.route('/api/train', methods=['POST'])
def train_persona():
    data = request.json or {}
    raw_text = data.get('raw_text', '')
    target_person = data.get('target_person', '')
    persona_id = data.get('persona_id', 'persona-' + str(np.random.randint(1000, 9999)))
    
    messages = data.get('messages')
    if not messages and raw_text:
        messages = parse_raw_chat(raw_text)
        
    if not messages or not target_person:
        return jsonify({'error': 'Missing messages or target_person'}), 400

    model = train_persona_ml_model(messages, target_person)
    if not model:
        return jsonify({'error': f'No conversation pairs found for speaker {target_person}'}), 400

    PERSONA_MODELS[persona_id] = model
    
    df = model['df']
    sample_responses = df['response'].head(10).tolist()
    
    return jsonify({
        'success': True,
        'persona_id': persona_id,
        'total_pairs': len(df),
        'sample_responses': sample_responses,
        'message': f'Python Scikit-Learn TF-IDF model trained for {target_person} on {len(df)} dialogue turns!'
    })

@app.route('/api/generate', methods=['POST'])
def generate_reply():
    data = request.json or {}
    persona_id = data.get('persona_id')
    user_message = data.get('user_message', '').strip()
    
    if not user_message:
        return jsonify({'reply': '...'})
        
    model = PERSONA_MODELS.get(persona_id)
    
    # If no pre-trained model ID, train on-the-fly if chat_pairs provided
    if not model and 'chat_pairs' in data and len(data['chat_pairs']) > 0:
        df = pd.DataFrame(data['chat_pairs'])
        word_vec = TfidfVectorizer(ngram_range=(1, 3), sublinear_tf=True)
        word_matrix = word_vec.fit_transform(df['context'] if 'context' in df else df['prompt'])
        char_vec = TfidfVectorizer(analyzer='char_wb', ngram_range=(2, 5), sublinear_tf=True)
        char_matrix = char_vec.fit_transform(df['context'] if 'context' in df else df['prompt'])
        
        # Normalize column name
        if 'response' not in df and 'output' in df:
            df['response'] = df['output']
        elif 'response' not in df and 'response' in df:
            pass
            
        model = {
            'word_vectorizer': word_vec,
            'word_matrix': word_matrix,
            'char_vectorizer': char_vec,
            'char_matrix': char_matrix,
            'df': df,
            'recent_responses': []
        }
        PERSONA_MODELS[persona_id] = model

    if not model:
        # Generic fallback if no ML model exists for this ID
        return jsonify({'reply': 'Haa 🥲', 'mode': 'fallback'})

    df = model['df']
    response_col = 'response' if 'response' in df.columns else df.columns[1]

    # 1. Word Vector Cosine Similarity
    q_word_vec = model['word_vectorizer'].transform([user_message])
    word_sims = cosine_similarity(q_word_vec, model['word_matrix']).flatten()

    # 2. Character N-Gram Vector Cosine Similarity (Phonetic & Hinglish match)
    q_char_vec = model['char_vectorizer'].transform([user_message])
    char_sims = cosine_similarity(q_char_vec, model['char_matrix']).flatten()

    # 3. Hybrid Score Combination
    hybrid_scores = 0.5 * word_sims + 0.5 * char_sims

    # Find top candidates with score > 0.05
    top_indices = np.argsort(hybrid_scores)[::-1]
    
    best_reply = None
    recent = model.get('recent_responses', [])

    for idx in top_indices:
        cand = df.iloc[idx][response_col]
        score = hybrid_scores[idx]
        
        # Skip if replied recently to avoid repetition
        if cand in recent and len(df) > 3:
            continue
            
        if score > 0.02:
            best_reply = cand
            break

    if not best_reply:
        # Fallback to random response from dataframe
        random_idx = np.random.randint(0, len(df))
        best_reply = df.iloc[random_idx][response_col]

    # Update recent queue
    recent.append(best_reply)
    if len(recent) > 5:
        recent.pop(0)
    model['recent_responses'] = recent

    return jsonify({
        'reply': best_reply,
        'max_similarity_score': float(np.max(hybrid_scores)),
        'mode': 'python_scikit_learn_tfidf'
    })

if __name__ == '__main__':
    print("Starting Python Machine Learning Server for MyFriend AI on http://127.0.0.1:5000...")
    app.run(host='127.0.0.1', port=5000, debug=True)
