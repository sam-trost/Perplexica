import EmptyChatMessageInput from './EmptyChatMessageInput';

const EmptyChat = ({
  sendMessage,
  focusMode,
  setFocusMode,
  domain,
  setDomain,
}: {
  sendMessage: (message: string) => void;
  focusMode: string;
  setFocusMode: (mode: string) => void;
  domain: string;
  setDomain: (domain: string) => void;
}) => {
  return (
    <div className="flex flex-col items-center justify-center max-w-screen-sm min-h-screen p-2 mx-auto space-y-8">
      <h2 className="-mt-8 text-3xl font-medium text-white/70">
        Research begins here.
      </h2>
      <EmptyChatMessageInput
        sendMessage={sendMessage}
        focusMode={focusMode}
        setFocusMode={setFocusMode}
        domain={domain}
        setDomain={setDomain}
      />
    </div>
  );
};

export default EmptyChat;
