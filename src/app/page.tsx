"use client";
import { useChat } from "@ai-sdk/react";
import { FormEvent, KeyboardEvent, useState } from "react";
import { Converter } from "showdown";

import Spinner from "./components/spinner";

import { DefaultChatTransport } from "ai";

export default function Chat() {
  const [input, setInput] = useState("");
  const [lastRequest, setLastRequest] = useState("");
  /* useChat hook helps us handle the input, resulting messages, and also handle the loading and error states for a better user experience */
  const { messages, sendMessage, status, stop, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });
  const markdownConverter = new Converter();

  function sendUserChat(
    event: FormEvent<HTMLFormElement> | KeyboardEvent<HTMLInputElement>
  ) {
    event.preventDefault();
    if (input.trim()) {
      sendMessage({
        parts: [{ type: "text", text: input }],
      });
      setLastRequest(input);
      setInput("");
    }
  }

  return (
    <div className="chat__form">
      <div className="chat__messages">
        {
          /* Display all user messages and assistant responses */
          messages.map((m) => (
            <div key={m.id} className="message">
              <div>
                {/* Messages with the role of *assistant* denote responses from the LLM */}
                <div className="role">
                  {m.role === "user" ? "Me" : "Sorley"}
                </div>
                {/* Tool handling */}
                <div className="tools__summary">
                  {m.parts.map((part, index) => {
                    if (part.type === "text") {
                      { /* User or LLM generated content */}
                      return (
                        <div
                          className="itinerary__div"
                          key={`${m.id}-${index}-text`}
                          dangerouslySetInnerHTML={{
                            __html: markdownConverter.makeHtml(part.text),
                          }}></div>
                      );
                    } 
                  })}
                </div>
              </div>
            </div>
          ))
        }
      </div>
      {
        /* Spinner shows when awaiting a response */
        (status === "submitted" || status === "streaming") && (
          <div className="spinner__container">
            <Spinner />
            <button id="stop__button" type="button" onClick={() => stop()}>
              Stop
            </button>
          </div>
        )
      }
      {
        /* Show error message and return button when something goes wrong */
        error && (
          <>
            <div className="error__container">
              Unable to generate a plan. Please try again later!
            </div>
            <button
              id="retry__button"
              type="button"
              onClick={() => sendMessage({ text: lastRequest })}
            >
              Retry
            </button>
          </>
        )
      }
      <form
        onSubmit={(event) => {
          sendUserChat(event);
        }}
      >
        <input
          className="search-box__input"
          value={input}
          placeholder="Where would you like to go?"
          disabled={status !== "ready"}
          onChange={(event) => {
            setInput(event.target.value);
          }}
          onKeyDown={async (event) => {
            if (event.key === "Enter") {
              sendUserChat(event);
            }
          }}
        />
      </form>
    </div>
  );
}
