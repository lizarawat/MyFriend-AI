import os
import sys
import json
import tkinter as tk
from tkinter import filedialog, messagebox
import customtkinter as ctk
from persona_ml import PersonaMLEngine

# Set CustomTkinter Theme to Dark Glassmorphism
ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("blue")

class MyFriendAIApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("MyFriend AI - Virtual Person Replica Suite (Python & C++ Engine)")
        self.geometry("1100 x 700")

        # Active personas storage
        self.personas = {}
        self.active_persona_id = None
        self.chat_histories = {}

        self.init_default_personas()
        self.build_ui()

    def init_default_personas(self):
        # Bunty Sample
        bunty_engine = PersonaMLEngine("Bunty")
        sample_bunty_raw = """
15/09/24, 10:15 - You: oie
15/09/24, 10:15 - Bunty: Hn
15/09/24, 10:16 - You: kya karra tu
15/09/24, 10:16 - Bunty: kuch nhi bhai chill karra tu bata 🥲
15/09/24, 10:17 - You: tujhe hindi aati hai?
15/09/24, 10:17 - Bunty: haa bilkul aati h bhai
15/09/24, 10:18 - You: kya internship ke baad?
15/09/24, 10:18 - Bunty: wahi job dhundenge 🥲
15/09/24, 10:19 - You: hyein??
15/09/24, 10:19 - Bunty: haa sahi me yrr
        """
        msgs = bunty_engine.parse_raw_text(sample_bunty_raw)
        bunty_engine.train(msgs)

        self.personas["bunty"] = {
            "name": "Bunty",
            "tag": "Hinglish Desi Viber",
            "engine": bunty_engine
        }
        self.chat_histories["bunty"] = [
            {"sender": "Bunty", "text": "Hn 🥲"}
        ]

        # Alex Sample
        alex_engine = PersonaMLEngine("Alex")
        sample_alex_raw = """
15/09/24, 10:15 - You: hey bro what are you doing?
15/09/24, 10:15 - Alex: deadass chilling 💀
15/09/24, 10:16 - You: want to grab pizza?
15/09/24, 10:16 - Alex: lol okay whatever you say
15/09/24, 10:17 - You: you serious?
15/09/24, 10:17 - Alex: sureee because that makes total sense 💀
        """
        alex_msgs = alex_engine.parse_raw_text(sample_alex_raw)
        alex_engine.train(alex_msgs)

        self.personas["alex"] = {
            "name": "Alex",
            "tag": "Sarcastic & Witty",
            "engine": alex_engine
        }
        self.chat_histories["alex"] = [
            {"sender": "Alex", "text": "yo deadass chilling 💀"}
        ]

        self.active_persona_id = "bunty"

    def build_ui(self):
        # Main Grid Layout
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        # ----------------- SIDEBAR (WhatsApp-style Contact List) -----------------
        self.sidebar_frame = ctk.CTkFrame(self, width=320, corner_radius=0, fg_color="#0b101a")
        self.sidebar_frame.grid(row=0, column=0, sticky="nsew")

        # Logo / Title
        self.logo_label = ctk.CTkLabel(
            self.sidebar_frame, 
            text="🤖 MyFriend AI", 
            font=ctk.CTkFont(size=20, weight="bold"),
            text_color="#00f2fe"
        )
        self.logo_label.pack(padx=20, pady=(20, 5))

        self.sub_logo = ctk.CTkLabel(
            self.sidebar_frame, 
            text="Python & C++ Native Engine", 
            font=ctk.CTkFont(size=11),
            text_color="#9ca3af"
        )
        self.sub_logo.pack(padx=20, pady=(0, 15))

        # Import Chat Button
        self.import_btn = ctk.CTkButton(
            self.sidebar_frame,
            text="+ Import Chat / Zip / Folder",
            font=ctk.CTkFont(size=13, weight="bold"),
            fg_color="transparent",
            border_color="#00f2fe",
            border_width=1,
            hover_color="#1e293b",
            text_color="#00f2fe",
            command=self.import_chat_dialog
        )
        self.import_btn.pack(padx=16, pady=10, fill="x")

        self.contacts_label = ctk.CTkLabel(
            self.sidebar_frame, 
            text="VIRTUAL FRIENDS", 
            font=ctk.CTkFont(size=11, weight="bold"),
            text_color="#6b7280"
        )
        self.contacts_label.pack(padx=20, pady=(15, 5), anchor="w")

        # Contact List Scrollable Frame
        self.contacts_list_frame = ctk.CTkScrollableFrame(self.sidebar_frame, fg_color="transparent")
        self.contacts_list_frame.pack(padx=10, pady=5, fill="both", expand=True)

        self.render_contact_buttons()

        # ----------------- MAIN CHAT AREA -----------------
        self.chat_main_frame = ctk.CTkFrame(self, fg_color="#111827", corner_radius=0)
        self.chat_main_frame.grid(row=0, column=1, sticky="nsew")

        self.chat_main_frame.grid_columnconfigure(0, weight=1)
        self.chat_main_frame.grid_rowconfigure(1, weight=1)

        # Header
        self.header_frame = ctk.CTkFrame(self.chat_main_frame, height=60, fg_color="#1e293b", corner_radius=0)
        self.header_frame.grid(row=0, column=0, sticky="ew")

        self.header_title = ctk.CTkLabel(
            self.header_frame, 
            text="Bunty", 
            font=ctk.CTkFont(size=18, weight="bold"),
            text_color="#f3f4f6"
        )
        self.header_title.pack(side="left", padx=20, pady=12)

        self.engine_badge = ctk.CTkLabel(
            self.header_frame, 
            text="⚡ C++ Engine (g++ -O3) + Python Scikit-Learn Active", 
            font=ctk.CTkFont(size=11, weight="bold"),
            text_color="#10b981",
            fg_color="#065f46",
            corner_radius=8,
            padx=10,
            pady=4
        )
        self.engine_badge.pack(side="right", padx=20, pady=12)

        # Chat History Scrollable Box
        self.chat_box = ctk.CTkScrollableFrame(self.chat_main_frame, fg_color="#0d131f")
        self.chat_box.grid(row=1, column=0, sticky="nsew", padx=20, pady=15)

        # Chat Input Controls
        self.input_frame = ctk.CTkFrame(self.chat_main_frame, height=70, fg_color="#1e293b", corner_radius=0)
        self.input_frame.grid(row=2, column=0, sticky="ew")

        self.msg_entry = ctk.CTkEntry(
            self.input_frame, 
            placeholder_text="Type a message...",
            font=ctk.CTkFont(size=14),
            height=45,
            fg_color="#0d131f",
            border_color="#374151"
        )
        self.msg_entry.pack(side="left", padx=(20, 10), pady=12, fill="x", expand=True)
        self.msg_entry.bind("<Return>", lambda event: self.send_message())

        self.send_btn = ctk.CTkButton(
            self.input_frame, 
            text="Send", 
            font=ctk.CTkFont(size=14, weight="bold"),
            height=45,
            width=90,
            fg_color="#00f2fe",
            text_color="#000000",
            hover_color="#38bdf8",
            command=self.send_message
        )
        self.send_btn.pack(side="right", padx=(0, 20), pady=12)

        self.render_chat_messages()

    def render_contact_buttons(self):
        for widget in self.contacts_list_frame.winfo_children():
            widget.destroy()

        for pid, pdata in self.personas.items():
            is_active = (pid == self.active_persona_id)
            btn = ctk.CTkButton(
                self.contacts_list_frame,
                text=f"👤 {pdata['name']} ({pdata['tag']})",
                font=ctk.CTkFont(size=13, weight="bold" if is_active else "normal"),
                anchor="w",
                fg_color="#1e293b" if is_active else "transparent",
                text_color="#00f2fe" if is_active else "#9ca3af",
                hover_color="#1e293b",
                height=45,
                command=lambda p=pid: self.select_persona(p)
            )
            btn.pack(fill="x", pady=3)

    def select_persona(self, pid):
        self.active_persona_id = pid
        self.header_title.configure(text=self.personas[pid]["name"])
        self.render_contact_buttons()
        self.render_chat_messages()

    def render_chat_messages(self):
        for widget in self.chat_box.winfo_children():
            widget.destroy()

        msgs = self.chat_histories.get(self.active_persona_id, [])
        for m in msgs:
            is_user = (m["sender"] == "You")
            
            row_frame = ctk.CTkFrame(self.chat_box, fg_color="transparent")
            row_frame.pack(fill="x", pady=6)

            bubble = ctk.CTkLabel(
                row_frame,
                text=m["text"],
                font=ctk.CTkFont(size=13),
                wraplength=450,
                justify="right" if is_user else "left",
                fg_color="#0284c7" if is_user else "#1e293b",
                text_color="#ffffff" if is_user else "#f3f4f6",
                corner_radius=14,
                padx=14,
                pady=10
            )
            
            if is_user:
                bubble.pack(side="right", padx=10)
            else:
                bubble.pack(side="left", padx=10)

    def send_message(self):
        text = self.msg_entry.get().strip()
        if not text or not self.active_persona_id:
            return

        self.msg_entry.delete(0, tk.END)

        # Add user message
        self.chat_histories[self.active_persona_id].append({"sender": "You", "text": text})
        self.render_chat_messages()

        # Generate ML reply using Python & C++ Engine
        pdata = self.personas[self.active_persona_id]
        engine = pdata["engine"]

        reply = engine.generate_reply(text, use_cpp=True)

        self.chat_histories[self.active_persona_id].append({"sender": pdata["name"], "text": reply})
        self.render_chat_messages()

    def import_chat_dialog(self):
        file_path = filedialog.askopenfilename(
            title="Select WhatsApp Chat Export File (.txt or .zip)",
            filetypes=[("Chat Export Files", "*.txt *.zip"), ("All Files", "*.*")]
        )
        if not file_path:
            return

        target_name = ctk.CTkInputDialog(text="Enter the name of your friend in this chat export:", title="Friend Name").get_input()
        if not target_name:
            return

        engine = PersonaMLEngine(target_name.strip())
        msgs = engine.parse_chat_file(file_path)
        success = engine.train(msgs)

        if not success:
            messagebox.showerror("Error", f"Could not find any dialogue turns for {target_name} in this file.")
            return

        pid = "persona-" + target_name.lower().replace(" ", "_")
        self.personas[pid] = {
            "name": target_name.strip(),
            "tag": "Custom ML Persona",
            "engine": engine
        }
        self.chat_histories[pid] = [
            {"sender": target_name.strip(), "text": f"Hey! I've analyzed our chats with Python & C++ ML and I'm ready to talk!"}
        ]

        self.select_persona(pid)
        messagebox.showinfo("Success", f"Python & C++ ML Engine trained for {target_name} successfully!")

if __name__ == "__main__":
    app = MyFriendAIApp()
    app.mainloop()
