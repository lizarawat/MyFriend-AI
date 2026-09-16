/**
 * PersonaEcho AI - Multi-Format Chat Parser Engine
 * Extracts participants, timestamps, and message strings from exported chat logs.
 */

export function parseChatLog(rawText, fileType = 'auto') {
  if (!rawText || typeof rawText !== 'string') {
    return { error: 'Empty or invalid file content' };
  }

  // 1. Try JSON parsing (Telegram / Discord JSON export)
  if (fileType === 'json' || rawText.trim().startsWith('{') || rawText.trim().startsWith('[')) {
    try {
      const data = JSON.parse(rawText);
      const parsedJSON = parseJSONExport(data);
      if (parsedJSON.messages.length > 0) return parsedJSON;
    } catch (e) {
      // Fallback to text parser if JSON fails
    }
  }

  // 2. Standard Text Parser (WhatsApp / Discord / Raw Transcript)
  const lines = rawText.split(/\r?\n/);
  const messages = [];
  const participantsSet = new Set();

  // Common Regex Patterns for Chat Exports
  // 1. WhatsApp Standard: "15/09/24, 10:15 - Name: Message"
  // 2. WhatsApp Bracketed: "[15/09/24, 10:15:22 AM] Name: Message"
  // 3. Simple Colon: "Name: Message"
  // 4. Bracket Name: "[Name]: Message"
  const waStandardRegex = /^\d{1,2}\/\d{1,2}\/\d{2,4},\s*\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?\s*-\s*([^:]+):\s*(.*)$/i;
  const waBracketRegex = /^\[\d{1,2}\/\d{1,2}\/\d{2,4},\s*\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?\]\s*([^:]+):\s*(.*)$/i;
  const discordStandardRegex = /^\[?\d{2,4}-\d{1,2}-\d{1,2}\s*\d{1,2}:\d{2}\]?\s*([^:]+):\s*(.*)$/i;
  const simpleColonRegex = /^([A-Z0-9_\s]{2,25}):\s*(.*)$/i;

  let currentMsg = null;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Check for standard system messages (e.g. "Messages and calls are end-to-end encrypted")
    if (line.includes('end-to-end encrypted') || line.includes('created group') || line.includes('changed the subject')) {
      continue;
    }

    let match = line.match(waStandardRegex) || 
                line.match(waBracketRegex) || 
                line.match(discordStandardRegex) || 
                line.match(simpleColonRegex);

    if (match) {
      const sender = match[1].trim();
      const text = match[2].trim();

      // Filter out media omitted lines
      if (text === '<Media omitted>' || text === '‎image omitted' || text === '‎video omitted') {
        continue;
      }

      if (sender && text) {
        participantsSet.add(sender);
        currentMsg = {
          sender,
          text,
          timestamp: new Date().toISOString()
        };
        messages.push(currentMsg);
      }
    } else if (currentMsg) {
      // Multi-line message continuation
      currentMsg.text += '\n' + line;
    }
  }

  const participants = Array.from(participantsSet);

  if (messages.length === 0) {
    return {
      error: 'Could not detect chat format. Please ensure lines are in format "Name: Message" or standard export format.'
    };
  }

  return {
    success: true,
    totalMessages: messages.length,
    participants,
    messages
  };
}

function parseJSONExport(data) {
  const messages = [];
  const participantsSet = new Set();

  // Telegram JSON structure
  const msgList = data.messages || (Array.isArray(data) ? data : []);

  for (const m of msgList) {
    if (!m) continue;
    let sender = m.from || m.author?.name || m.user || m.sender;
    let text = m.text;

    if (Array.isArray(text)) {
      // Telegram text entity array
      text = text.map(t => (typeof t === 'string' ? t : t.text || '')).join('');
    }

    if (sender && typeof text === 'string' && text.trim()) {
      participantsSet.add(sender);
      messages.push({
        sender,
        text: text.trim(),
        timestamp: m.date || new Date().toISOString()
      });
    }
  }

  return {
    success: messages.length > 0,
    totalMessages: messages.length,
    participants: Array.from(participantsSet),
    messages
  };
}
