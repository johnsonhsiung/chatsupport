"use client";
import { useState, useEffect } from "react";
import { Box, Stack, TextField, IconButton, Typography, useTheme } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import NightlightRoundIcon from "@mui/icons-material/NightlightRound";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import MicIcon from "@mui/icons-material/Mic";
import EmojiPicker from 'emoji-picker-react';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ResponsiveAppBar from "./components/Navbar";

export default function Home() {
  const theme = useTheme();
  const [messages, setMessages] = useState([
    { role: "assistant", content: `Hello, how can I assist you with your signing journey?` },
  ]);
  const [message, setMessage] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = false; // Stops automatically after a single result
        recog.interimResults = true; // Process results as they are spoken
        recog.lang = 'en-US'; // Set language to English (US)

        recog.onstart = () => {
          console.log('Voice recognition activated. Speak into the microphone.');
        };

        recog.onresult = (event) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = 0; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          console.log('Interim Transcript:', interimTranscript);
          console.log('Final Transcript:', finalTranscript);

          setMessage(prev => prev + finalTranscript);
          if (finalTranscript) {
            recognition.stop();
            setIsListening(false);
          }
        };

        recog.onend = () => {
          console.log('Voice recognition stopped.');
          setIsListening(false);
        };

        recog.onerror = (event) => {
          console.error('Speech recognition error detected:', event.error);
          setIsListening(false);
          recog.stop();
        };

        setRecognition(recog);
      }
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else if (recognition) {
      recognition.start();
      setIsListening(true);
    }
  };

  const sendMessage = async () => {
    if (message.trim() === "") return;
    setMessage("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: message },
      { role: "assistant", content: "..." },
    ]);
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([...messages, { role: "user", content: message }]),
    });
    const text = await response.text();
    setMessages((prev) => {
      const updated = [...prev];
      updated[updated.length - 1].content = text;
      return updated;
    });
  };

  const onEmojiClick = (event, emojiObject) => {
    setMessage((prev) => prev + emojiObject.emoji);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevents the default action (like a newline)
      sendMessage();
    }
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      sx={{ background: "linear-gradient(#060F14, #132f3f)" }}
      boxShadow="rgba(0, 0, 0, 0.45) 0px 25px 20px -20px;"
      display="flex"
      borderRadius="20px"
      p={4}
      spacing={3}
    >
      <ResponsiveAppBar />
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        p={5}
      >
        <Stack
          direction="column"
          width="1000px"
          height="700px"
          sx={{
            background: darkMode ? "#132f3f" : "#fff",
            boxShadow: "rgba(0, 0, 0, 0.45) 0px 25px 20px -20px;",
            borderRadius: "20px",
            p: 4,
            spacing: 3,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h4" sx={{ fontWeight: "bold", fontSize: "1.5em", letterSpacing: "0.1em", borderBottom: "2px solid", borderBottomColor: darkMode ? "#3498db" : "#8e44ad", pb: 1, mb: 2 }}>
              ChatSupport
            </Typography>
            <IconButton onClick={toggleDarkMode}>
              {darkMode ? <WbSunnyIcon /> : <NightlightRoundIcon />}
            </IconButton>
          </Stack>

          <Stack
            direction="column"
            spacing={2}
            p={3}
            flexGrow={1}
            maxHeight="100%"
            sx={{
              overflow: "auto",
              "&::-webkit-scrollbar": {
                display: "none",
              },
            }}
          >
            {messages.map((message, index) => (
              <Box
                key={index}
                display="flex"
                justifyContent={message.role === "assistant" ? "flex-start" : "flex-end"}
              >
                <Box
                  color="white"
                  sx={{
                    background: message.role === "assistant" ? (darkMode ? "#060F14" : "#132f3f") : (darkMode ? "#060F14" : "#132f3f"),
                    borderRadius: "16px",
                    boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
                    backdropFilter: "blur(5px)",
                    border: "1px solid rgba(144, 145, 158, 0.14)",
                  }}
                  p={3}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </Box>
              </Box>
            ))}
          </Stack>

          <Stack
            sx={{ border: "2px solid #060F14" }}
            bgcolor="transparent"
            direction="row"
            spacing={2}
            borderRadius="20px"
            borderColor="transparent"
          >
            <TextField
              placeholder="Ask Away!"
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderRadius: "0px",
                    border: "0px solid rgba(0,0,0,0)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "white",
                    border: "2px solid #FFFFFF",
                    borderRadius: "20px",
                  },
                },
                "& .MuiInputBase-input": {
                  color: darkMode ? "white" : "black",
                },
              }}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                    <EmojiEmotionsIcon />
                  </IconButton>
                ),
                disableUnderline: true,
              }}
              fullWidth
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown} // Trigger sendMessage on Enter
            ></TextField>
            <IconButton color="primary" onClick={sendMessage}>
              <SendIcon />
            </IconButton>
            <IconButton color="primary" onClick={toggleListening}>
              <MicIcon color={isListening ? "error" : "inherit"} />
            </IconButton>
          </Stack>

          {showEmojiPicker && (
            <Box sx={{ position: "absolute", bottom: "70px", right: "50px", zIndex: 1000 }}>
              <EmojiPicker onEmojiClick={onEmojiClick} />
            </Box>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
