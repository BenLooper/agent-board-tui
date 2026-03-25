import React, { useState, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import SelectInput from "ink-select-input";
import { useStore } from "../store";
import { api } from "../api/client";
import type { InputRequest, Question } from "../api/types";

interface Props {
  request: InputRequest;
}

export function InputModal({ request }: Props) {
  const focusMode = useStore((s) => s.focusMode);
  const setFocusMode = useStore((s) => s.setFocusMode);
  const view = useStore((s) => s.view);

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [textValue, setTextValue] = useState(
    request.questions[0]?.default ?? ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const question: Question | undefined = request.questions[currentQ];

  const submit = useCallback(async (finalAnswers: Record<string, string>) => {
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/input/${request.id}/answer`, { answers: finalAnswers });
      setFocusMode(view as "board" | "chat" | "admin");
    } catch (e) {
      setError(String(e));
      setSubmitting(false);
    }
  }, [request.id, setFocusMode, view]);

  const advance = useCallback(
    (answer: string) => {
      const newAnswers = { ...answers, [question!.id]: answer };
      setAnswers(newAnswers);
      if (currentQ + 1 < request.questions.length) {
        setCurrentQ(currentQ + 1);
        setTextValue(request.questions[currentQ + 1]?.default ?? "");
      } else {
        submit(newAnswers);
      }
    },
    [answers, currentQ, question, request.questions, submit]
  );

  useInput(
    (input, key) => {
      if (key.escape && !submitting) {
        // Can't really cancel an input request — just go back to view
        setFocusMode(view as "board" | "chat" | "admin");
      }
    },
    { isActive: focusMode === "input-modal" && question?.type !== "text" }
  );

  if (!question) return null;

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="yellow"
      paddingX={2}
      paddingY={1}
    >
      <Box marginBottom={1} justifyContent="space-between">
        <Text bold color="yellow">
          Agent Input Request
        </Text>
        <Text color="gray">
          Question {currentQ + 1} / {request.questions.length}
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text bold>{question.prompt}</Text>
      </Box>

      {question.type === "yesno" && (
        <SelectInput
          items={[
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" },
          ]}
          onSelect={(item) => advance(item.value)}
          isFocused={focusMode === "input-modal"}
        />
      )}

      {question.type === "choice" && question.options && (
        <SelectInput
          items={question.options.map((opt) => ({ label: opt, value: opt }))}
          onSelect={(item) => advance(item.value)}
          isFocused={focusMode === "input-modal"}
        />
      )}

      {question.type === "text" && (
        <Box gap={1}>
          <Text color="cyan">▶</Text>
          <TextInput
            value={textValue}
            onChange={setTextValue}
            onSubmit={advance}
            focus={focusMode === "input-modal"}
          />
        </Box>
      )}

      {submitting && (
        <Box marginTop={1}>
          <Text color="green">Submitting answers…</Text>
        </Box>
      )}

      {error && (
        <Box marginTop={1}>
          <Text color="red">Error: {error}</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text color="gray" dimColor>
          {question.type === "text"
            ? "Enter to confirm  Esc to dismiss"
            : "j/k select  Enter confirm  Esc dismiss"}
        </Text>
      </Box>
    </Box>
  );
}
