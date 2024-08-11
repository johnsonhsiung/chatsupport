"use client";
import Image from "next/image";
import { Box, Stack, TextField, Button, Fab, THe } from "@mui/material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import ResponsiveAppBar from "./components/Navbar";
import SendIcon from "@mui/icons-material/Send";
import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hello, how can I assist you with your signing journey?`,
    },
  ]);
  const [message, setMessage] = useState("");

  const sendMessage = async () => {
    setMessage("");
    setMessages((messages) => [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: "" },
    ]);
    const response = fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify([...messages, { role: "user", content: message }]),
    }).then(async (res) => {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let result = "";
      return reader.read().then(function processText({ done, value }) {
        if (done) return result;
        const text = decoder.decode(value || new Int8Array(), {
          stream: true,
        });
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1];
          let otherMessages = messages.slice(0, messages.length - 1);
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
          ];
        });
        return reader.read().then(processText);
      });
    });
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      sx={{ background: "linear-gradient(to right,#060F14, #132f3f)" }}
      p={0}
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
          sx={{ background: "linear-gradient(#060F14, #132f3f)" }}
          boxShadow="rgba(0, 0, 0, 0.45) 0px 25px 20px -20px;"
          borderRadius="20px"
          p={4}
          spacing={3}
        >
          <Stack
            direction="column"
            spacing={2}
            p={3}
            flexGrow={1}
            maxHeight="100%"
            sx={{
              overflow: "auto",
              "&::-webkit-scrollbar": {
                width: "20px", // Custom width for scrollbar
                height: "10px",
              },
              "&:hover": {
                overflow: "auto",
                "&::-webkit-scrollbar": {
                  width: "20px", // Custom width for scrollbar
                  height: "10px",
                },
                "&::-webkit-scrollbar-thumb": {
                  transition: "2s",
                  backgroundColor: "#132f3f", // Scrollbar thumb color
                  borderRadius: "10px", // Round the corners of the scrollbar thumb
                },
                "&::-webkit-scrollbar-track": {
                  backgroundColor: "transparent", // Scrollbar track color
                  borderRadius: "10px", // Round the corners of the scrollbar track
                },
              },
            }}
          >
            {messages.map((message, index) => (
              <Box
                key={index}
                display="flex"
                justifyContent={
                  message.role === "assistant" ? "flext-start" : "flex-end"
                }
              >
                <Box
                  color="white"
                  sx={{
                    background: "rgba(144, 145, 158, 0.17)",
                    borderRadius: "16px",
                    boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
                    backdropFilter: "blur(5px)",
                    "&::-webkit-backdrop-filter": "blur(5px)",
                    border: "1px solid rgba(144, 145, 158, 0.14)",
                  }}
                  borderRadius={2}
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
              border="none"
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderRadius: "0px",
                    border: "0px solid rgba(0,0,0,0)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "white", // Border color when focused
                    border: "2px solid #FFFFFF",
                    borderRadius: "20px",
                  },
                },
                "& .MuiInputBase-input": {
                  color: "white", // Text color
                },
              }}
              InputProps={{
                endAdornment: (
                  <SendIcon
                    onClick={sendMessage}
                    sx={{
                      cursor: "pointer",
                      "&:hover": {
                        cursor: "pointer", // Border color when hovered
                      },
                    }}
                  />
                ),
                disableUnderline: true,
              }}
              fullWidth
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            ></TextField>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
