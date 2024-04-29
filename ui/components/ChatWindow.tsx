'use client';

import { useEffect, useState } from 'react';
import { Document } from '@langchain/core/documents';
import Navbar from './Navbar';
import Chat from './Chat';
import EmptyChat from './EmptyChat';

export type Message = {
  id: string;
  createdAt: Date;
  content: string;
  role: 'user' | 'assistant';
  sources?: Document[];
};

const useSocket = (url: string) => {
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (!ws) {
      const ws = new WebSocket(url);
      ws.onopen = () => {
        console.log('[DEBUG] open');
        setWs(ws);
      };
    }

    return () => {
      ws?.close();
      console.log('[DEBUG] closed');
    };
  }, [ws, url]);

  return ws;
};

const ChatWindow = () => {
  const ws = useSocket(process.env.NEXT_PUBLIC_WS_URL!);
  const [chatHistory, setChatHistory] = useState<[string, string][]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageAppeared, setMessageAppeared] = useState(false);
  const [focusMode, setFocusMode] = useState('webSearch');
  const [domain, setDomain] = useState('');

  const sendMessage = async (message: string) => {
    if (loading) return;
    setLoading(true);
    setMessageAppeared(false);

    let sources: Document[] | undefined = undefined;
    let recievedMessage = '';
    let added = false;

    ws?.send(
      JSON.stringify({
        type: 'message',
        content: message,
        focusMode: focusMode,
        domain: domain,
        history: [...chatHistory, ['human', message]],
      }),
    );

    setMessages((prevMessages) => [
      ...prevMessages,
      {
        content: message,
        id: Math.random().toString(36).substring(7),
        role: 'user',
        createdAt: new Date(),
      },
    ]);

    const messageHandler = (e: MessageEvent) => {
      const data = JSON.parse(e.data);

      if (data.type === 'sources') {
        sources = data.data;
        if (!added) {
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              content: '',
              id: data.messageId,
              role: 'assistant',
              sources: sources,
              createdAt: new Date(),
            },
          ]);
          added = true;
        }
        setMessageAppeared(true);
      }

      if (data.type === 'message') {
        if (!added) {
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              content: data.data,
              id: data.messageId,
              role: 'assistant',
              sources: sources,
              createdAt: new Date(),
            },
          ]);
          added = true;
        }

        setMessages((prev) =>
          prev.map((message) => {
            if (message.id === data.messageId) {
              return { ...message, content: message.content + data.data };
            }

            return message;
          }),
        );

        recievedMessage += data.data;
        setMessageAppeared(true);
      }

      if (data.type === 'messageEnd') {
        setChatHistory((prevHistory) => [
          ...prevHistory,
          ['human', message],
          ['assistant', recievedMessage],
        ]);
        ws?.removeEventListener('message', messageHandler);
        setLoading(false);
      }
    };

    ws?.addEventListener('message', messageHandler);
  };

  const rewrite = (messageId: string) => {
    const index = messages.findIndex((msg) => msg.id === messageId);

    if (index === -1) return;

    const message = messages[index - 1];

    setMessages((prev) => {
      return [...prev.slice(0, messages.length > 2 ? index - 1 : 0)];
    });
    setChatHistory((prev) => {
      return [...prev.slice(0, messages.length > 2 ? index - 1 : 0)];
    });

    sendMessage(message.content);
  };

  return ws ? (
    <div>
      {messages.length > 0 ? (
        <>
          <Navbar messages={messages} />
          <Chat
            loading={loading}
            messages={messages}
            sendMessage={sendMessage}
            messageAppeared={messageAppeared}
            rewrite={rewrite}
          />
        </>
      ) : (
        <EmptyChat
          sendMessage={sendMessage}
          focusMode={focusMode}
          setFocusMode={setFocusMode}
          domain={domain}
          setDomain={setDomain}
        />
      )}
    </div>
  ) : (
    <div className="flex flex-row items-center justify-center min-h-screen">
      <svg
        aria-hidden="true"
        className="w-8 h-8 text-[#202020] animate-spin fill-[#ffffff3b]"
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
          fill="currentColor"
        />
        <path
          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
          fill="currentFill"
        />
      </svg>
    </div>
  );
};

export default ChatWindow;
