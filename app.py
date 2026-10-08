import os
import sys
import json
import tkinter as tk
from tkinter import filedialog, messagebox
import customtkinter as ctk
from persona_ml import PersonaMLEngine

ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("blue")

class PersonSetupDialog(ctk.CTkToplevel):
    def __init__(self, parent, participants_summary):
        super().__init__(parent)

        self.title("Configure Person & Demographic Profile")
        self.geometry("520 x 560")
        self.resizable(False, False)
        self.grab_set()

        self.participants_summary = participants_summary
        self.result = None

        self.build_ui()

    def build_ui(self):
        # Header
        lbl_title = ctk.CTkLabel(
            self, 
            text="✨ Select Person & Define Personality", 
            font=ctk.CTkFont(size=18, weight="bold"),
            text_color="#00f2fe"
        )
        lbl_title.pack(padx=20, pady=(20, 5))

        lbl_sub = ctk.CTkLabel(
            self, 
            text="Choose which speaker from the chat log you want to turn into an AI bot:", 
            font=ctk.CTkFont(size=12),
            text_color="#9ca3af"
        )
        lbl_sub.pack(padx=20, pady=(0, 15))

        # 1. Select Participant Dropdown
        ctk.CTkLabel(self, text="Select Target Person from Chat File:", font=ctk.CTkFont(size=12, weight="bold")).pack(padx=20, anchor="w")
        
        participant_options = [f"{name} ({count} msgs)" for name, count in self.participants_summary]
        self.participant_combo = ctk.CTkComboBox(
            self, 
            values=participant_options,
            font=ctk.CTkFont(size=13),
            dropdown_font=ctk.CTkFont(size=12),
            height=38
        )
        self.participant_combo.pack(padx=20, pady=(4, 15), fill="x")
        if participant_options:
            bunty_opt = next((opt for opt in participant_options if "bunty" in opt.lower()), None)
            non_dot_opt = next((opt for opt in participant_options if not opt.startswith(".")), None)
            default_sel = bunty_opt or non_dot_opt or participant_options[0]
            self.participant_combo.set(default_sel)

        # 2. Age / Demographic Category
        ctk.CTkLabel(self, text="Age / Demographic Group:", font=ctk.CTkFont(size=12, weight="bold")).pack(padx=20, anchor="w")
        
        age_options = [
            "Gen-Z / Youth Texting (13-24)",
            "Millennial / Young Adult (25-35)",
            "Adult / Formal Communicator (36+)"
        ]
        self.age_combo = ctk.CTkComboBox(
            self, 
            values=age_options,
            font=ctk.CTkFont(size=13),
            dropdown_font=ctk.CTkFont(size=12),
            height=38
        )
        self.age_combo.pack(padx=20, pady=(4, 15), fill="x")
        self.age_combo.set("Gen-Z / Youth Texting (13-24)")

        # 3. Personality & Tone Description
        ctk.CTkLabel(self, text="Personality & Style Description (Custom Notes):", font=ctk.CTkFont(size=12, weight="bold")).pack(padx=20, anchor="w")
        
        self.desc_textbox = ctk.CTkTextbox(self, height=100, font=ctk.CTkFont(size=12))
        self.desc_textbox.pack(padx=20, pady=(4, 20), fill="x")
        self.desc_textbox.insert("1.0", "Talks in short Hinglish lines, uses 🥲, very chill, funny.")

        # Confirm Button
        btn_confirm = ctk.CTkButton(
            self, 
            text="Generate Virtual Replica Bot 🚀", 
            font=ctk.CTkFont(size=14, weight="bold"),
            fg_color="#00f2fe",
            text_color="#000000",
            hover_color="#38bdf8",
            height=45,
            command=self.on_confirm
        )
        btn_confirm.pack(padx=20, pady=10, fill="x")

    def on_confirm(self):
        selected_str = self.participant_combo.get()
        target_name = selected_str.split(" (")[0].strip() if "(" in selected_str else selected_str.strip()
        age_group = self.age_combo.get()
        description = self.desc_textbox.get("1.0", tk.END).strip()

        self.result = {
            "target_name": target_name,
            "age_group": age_group,
            "description": description
        }
        self.destroy()


class MyFriendAIApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("MyFriend AI - Virtual Person Replica Suite (Python & C++ Engine)")
        self.geometry("1100 x 700")

        self.personas = {}
        self.active_persona_id = None
        self.chat_histories = {}
        self.show_hidden = False

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
        bunty_engine.train(msgs, user_description="Uses 🥲 and short Hinglish lines", user_age="Gen-Z (18-24)")

        self.personas["bunty"] = {
            "name": "Bunty",
            "tag": "Hinglish Desi Viber",
            "engine": bunty_engine,
            "hidden": False
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
        alex_engine.train(alex_msgs, user_description="Sarcastic dry humor", user_age="Gen-Z")

        self.personas["alex"] = {
            "name": "Alex",
            "tag": "Sarcastic & Witty",
            "engine": alex_engine,
            "hidden": False
        }
        self.chat_histories["alex"] = [
            {"sender": "Alex", "text": "yo deadass chilling 💀"}
        ]

        self.active_persona_id = "bunty"

    def build_ui(self):
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        # SIDEBAR
        self.sidebar_frame = ctk.CTkFrame(self, width=320, corner_radius=0, fg_color="#0b101a")
        self.sidebar_frame.grid(row=0, column=0, sticky="nsew")

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

        # Toggle Show/Hide Hidden Contacts
        self.toggle_hidden_btn = ctk.CTkButton(
            self.sidebar_frame,
            text="👁️ Show Hidden Persons",
            font=ctk.CTkFont(size=11),
            fg_color="transparent",
            hover_color="#1e293b",
            text_color="#9ca3af",
            command=self.toggle_show_hidden
        )
        self.toggle_hidden_btn.pack(padx=16, pady=(0, 10), anchor="e")

        self.contacts_label = ctk.CTkLabel(
            self.sidebar_frame, 
            text="VIRTUAL FRIENDS", 
            font=ctk.CTkFont(size=11, weight="bold"),
            text_color="#6b7280"
        )
        self.contacts_label.pack(padx=20, pady=(5, 5), anchor="w")

        self.contacts_list_frame = ctk.CTkScrollableFrame(self.sidebar_frame, fg_color="transparent")
        self.contacts_list_frame.pack(padx=10, pady=5, fill="both", expand=True)

        self.render_contact_buttons()

        # MAIN CHAT AREA
        self.chat_main_frame = ctk.CTkFrame(self, fg_color="#111827", corner_radius=0)
        self.chat_main_frame.grid(row=0, column=1, sticky="nsew")

        self.chat_main_frame.grid_columnconfigure(0, weight=1)
        self.chat_main_frame.grid_rowconfigure(1, weight=1)

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

        self.chat_box = ctk.CTkScrollableFrame(self.chat_main_frame, fg_color="#0d131f")
        self.chat_box.grid(row=1, column=0, sticky="nsew", padx=20, pady=15)

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

    def toggle_show_hidden(self):
        self.show_hidden = not self.show_hidden
        self.toggle_hidden_btn.configure(text="👁️ Hide Hidden Persons" if self.show_hidden else "👁️ Show Hidden Persons")
        self.render_contact_buttons()

    def render_contact_buttons(self):
        for widget in self.contacts_list_frame.winfo_children():
            widget.destroy()

        for pid, pdata in list(self.personas.items()):
            if pdata.get("hidden", False) and not self.show_hidden:
                continue

            is_active = (pid == self.active_persona_id)

            item_row = ctk.CTkFrame(self.contacts_list_frame, fg_color="#1e293b" if is_active else "transparent", height=45)
            item_row.pack(fill="x", pady=3)

            btn = ctk.CTkButton(
                item_row,
                text=f"👤 {pdata['name']} {'(Hidden)' if pdata.get('hidden') else ''}",
                font=ctk.CTkFont(size=13, weight="bold" if is_active else "normal"),
                anchor="w",
                fg_color="transparent",
                text_color="#00f2fe" if is_active else "#9ca3af",
                hover_color="#1e293b",
                height=45,
                command=lambda p=pid: self.select_persona(p)
            )
            btn.pack(side="left", fill="x", expand=True)

            hide_btn = ctk.CTkButton(
                item_row,
                text="👁️" if pdata.get("hidden") else "🙈",
                width=30,
                height=30,
                fg_color="transparent",
                hover_color="#374151",
                command=lambda p=pid: self.toggle_hide_persona(p)
            )
            hide_btn.pack(side="right", padx=2)

            del_btn = ctk.CTkButton(
                item_row,
                text="🗑️",
                width=30,
                height=30,
                fg_color="transparent",
                hover_color="#ef4444",
                command=lambda p=pid: self.delete_persona(p)
            )
            del_btn.pack(side="right", padx=2)

    def delete_persona(self, pid):
        pname = self.personas[pid]["name"]
        if messagebox.askyesno("Confirm Delete", f"Are you sure you want to permanently delete {pname}?"):
            del self.personas[pid]
            if pid in self.chat_histories:
                del self.chat_histories[pid]

            remaining = list(self.personas.keys())
            if remaining:
                self.select_persona(remaining[0])
            else:
                self.active_persona_id = None
                self.header_title.configure(text="No Contact Selected")
                self.render_contact_buttons()
                self.render_chat_messages()

    def toggle_hide_persona(self, pid):
        self.personas[pid]["hidden"] = not self.personas[pid].get("hidden", False)
        self.render_contact_buttons()

    def select_persona(self, pid):
        self.active_persona_id = pid
        self.header_title.configure(text=self.personas[pid]["name"])
        self.render_contact_buttons()
        self.render_chat_messages()

    def render_chat_messages(self):
        for widget in self.chat_box.winfo_children():
            widget.destroy()

        if not self.active_persona_id:
            return

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

        self.chat_histories[self.active_persona_id].append({"sender": "You", "text": text})
        self.render_chat_messages()

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

        # Parse messages first to find all participants
        temp_engine = PersonaMLEngine("Temp")
        msgs = temp_engine.parse_chat_file(file_path)
        
        if not msgs:
            messagebox.showerror("Error", "Could not parse any messages from this chat file.")
            return

        participants_summary = PersonaMLEngine.get_participants_summary(msgs)

        # Open Setup Dialog to let user pick target person + describe age & personality
        dialog = PersonSetupDialog(self, participants_summary)
        self.wait_window(dialog)

        if not dialog.result:
            return

        target_name = dialog.result["target_name"]
        age_group = dialog.result["age_group"]
        description = dialog.result["description"]

        engine = PersonaMLEngine(target_name)
        success = engine.train(msgs, user_description=description, user_age=age_group)

        if not success:
            messagebox.showerror("Error", f"Could not find any dialogue turns for {target_name} in this file.")
            return

        pid = "persona-" + target_name.lower().replace(" ", "_")
        self.personas[pid] = {
            "name": target_name,
            "tag": age_group.split(" ")[0],
            "engine": engine,
            "hidden": False
        }
        self.chat_histories[pid] = [
            {"sender": target_name, "text": f"Hey! I've analyzed our chats with Python & C++ ML and I'm ready to talk!"}
        ]

        self.select_persona(pid)
        messagebox.showinfo("Success", f"Python & C++ ML Engine trained for {target_name} successfully!")

if __name__ == "__main__":
    app = MyFriendAIApp()
    app.mainloop()
