#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <unordered_map>
#include <unordered_set>
#include <cmath>
#include <algorithm>
#include <sstream>

using namespace std;

// High-Performance C++ Vectorizer & Cosine Similarity Engine
struct MatchResult {
    int index;
    double score;
    string response;
};

// Lowercase string in C++
string to_lower(const string& str) {
    string res = str;
    transform(res.begin(), res.end(), res.begin(), ::tolower);
    return res;
}

// Tokenize into 1-gram words and subword 2-4 ngrams
vector<string> extract_ngrams(const string& text) {
    vector<string> tokens;
    string clean = "";
    for (char c : text) {
        if (isalnum(c) || isspace(c)) {
            clean += tolower(c);
        } else {
            clean += ' ';
        }
    }

    stringstream ss(clean);
    string word;
    vector<string> words;
    while (ss >> word) {
        words.push_back(word);
        tokens.push_back(word);
    }

    // Subword char ngrams for Hinglish phonetic matching
    for (const string& w : words) {
        int len = w.length();
        for (int n = 2; n <= 4; ++n) {
            for (int i = 0; i <= len - n; ++i) {
                tokens.push_back(w.substr(i, n));
            }
        }
    }

    return tokens;
}

// Compute TF-IDF Sparse Vector
unordered_map<string, double> compute_tfidf(const vector<string>& tokens, const unordered_map<string, double>& idf_map, int total_docs) {
    unordered_map<string, double> tf;
    for (const auto& t : tokens) {
        tf[t] += 1.0;
    }

    double total = tokens.empty() ? 1.0 : (double)tokens.size();
    unordered_map<string, double> tfidf;

    for (const auto& pair : tf) {
        double term_tf = pair.second / total;
        auto it = idf_map.find(pair.first);
        double idf = (it != idf_map.end()) ? it->second : (log(total_docs + 1.0) + 1.0);
        tfidf[pair.first] = term_tf * idf;
    }

    return tfidf;
}

// C++ Cosine Similarity
double cosine_similarity(const unordered_map<string, double>& vec1, const unordered_map<string, double>& vec2) {
    double dot = 0.0, norm1 = 0.0, norm2 = 0.0;

    for (const auto& p : vec1) {
        norm1 += p.second * p.second;
        auto it = vec2.find(p.first);
        if (it != vec2.end()) {
            dot += p.second * it->second;
        }
    }

    for (const auto& p : vec2) {
        norm2 += p.second * p.second;
    }

    if (norm1 == 0.0 || norm2 == 0.0) return 0.0;
    return dot / (sqrt(norm1) * sqrt(norm2));
}

int main(int argc, char* argv[]) {
    if (argc < 3) {
        cout << "Usage: cpp_engine <query> <corpus_file.txt>" << endl;
        return 0;
    }

    string query = argv[1];
    string corpus_path = argv[2];

    ifstream file(corpus_path);
    if (!file.is_open()) {
        cerr << "Error opening corpus file: " << corpus_path << endl;
        return 1;
    }

    vector<string> prompts;
    vector<string> responses;

    string line;
    while (getline(file, line)) {
        size_t pos = line.find("\t");
        if (pos != string::npos) {
            prompts.push_back(line.substr(0, pos));
            responses.push_back(line.substr(pos + 1));
        }
    }
    file.close();

    int N = prompts.size();
    if (N == 0) {
        cout << "No responses found." << endl;
        return 0;
    }

    // Build IDF Map
    unordered_map<string, int> doc_freq;
    vector<vector<string>> all_tokens(N);

    for (int i = 0; i < N; ++i) {
        all_tokens[i] = extract_ngrams(prompts[i]);
        unordered_set<string> unique_t(all_tokens[i].begin(), all_tokens[i].end());
        for (const auto& t : unique_t) {
            doc_freq[t]++;
        }
    }

    unordered_map<string, double> idf_map;
    for (const auto& p : doc_freq) {
        idf_map[p.first] = log((double)(N + 1) / (p.second + 1.0)) + 1.0;
    }

    // Build vectors for all corpus contexts
    vector<unordered_map<string, double>> corpus_vectors(N);
    for (int i = 0; i < N; ++i) {
        corpus_vectors[i] = compute_tfidf(all_tokens[i], idf_map, N);
    }

    // Query Vector
    vector<string> q_tokens = extract_ngrams(query);
    unordered_map<string, double> q_vec = compute_tfidf(q_tokens, idf_map, N);

    // Compute C++ Cosine Similarities
    int best_idx = 0;
    double max_sim = -1.0;

    for (int i = 0; i < N; ++i) {
        double sim = cosine_similarity(q_vec, corpus_vectors[i]);
        if (sim > max_sim) {
            max_sim = sim;
            best_idx = i;
        }
    }

    cout << "C++ ML Match Score: " << max_sim << endl;
    cout << "RESPONSE: " << responses[best_idx] << endl;

    return 0;
}
