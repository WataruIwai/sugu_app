package backend.external;

import org.springframework.stereotype.Component;

import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;
import com.openai.models.ChatModel;
import com.openai.models.responses.ResponseCreateParams;
import com.openai.models.responses.StructuredResponse;
import com.openai.models.responses.StructuredResponseCreateParams;

import backend.external.dto.OpenAiResponse;

@Component
public class OpenAiClient {
    private final OpenAIClient client;

    public OpenAiClient() {
        this.client = OpenAIOkHttpClient.fromEnv();
    }

    public OpenAiResponse fetchWordData(String word) {
        StructuredResponseCreateParams<OpenAiResponse> params = ResponseCreateParams.builder()
                .model(ChatModel.GPT_5_4_NANO)
                .input("""
                        You are a dictionary assistant.
                        The user input is: %s

                        Rules:
                        1. If the input is a valid English word, return its meaning.
                        2. If the input looks like a typo:
                        - Return exactly 3 candidate words based on spelling similarity.
                        - Candidates must be single English words (no phrases).
                        - Candidates must be very close in spelling (small edit distance).
                        - Do NOT include the input itself as a candidate.
                        3. Do NOT infer meaning from context.

                        Output rules:
                        - Always include "candidates".
                        - If candidates are provided, resolvedWord must be null
                        - If the word is correct, candidates must be empty
                        - Never use empty strings.
                    """.formatted(word))
                .text(OpenAiResponse.class).build();

        StructuredResponse<OpenAiResponse> response = client.responses().create(params);

        return response.output().stream()
            .flatMap(item -> item.message().stream())
            .flatMap(message -> message.content().stream())
            .flatMap(content -> content.outputText().stream())
            .findFirst()
            .orElseThrow(() -> new RuntimeException("No structured output found"));
    }
}