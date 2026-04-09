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
                        Act as a dictionary assistant.

                        The user will input one word.
                        You must always return a JSON object.

                        Rules:
                        1. If the input is a valid English word:
                        - "inputWord" = the user's original input
                        - "candidates" = []
                        - "resolvedWord" = the valid input word
                        - If the word has multiple meanings:
                            - "meaning" must be an array of meanings in English
                            - "japanese" must be an array of corresponding Japanese translations
                            - "example" must be an array of example sentences
                        - If the word has only one meaning:
                            - You may return a single string OR an array with one element (prefer array for consistency)

                        2. If the input is misspelled or not a valid English word:
                        - "inputWord" = the user's original input
                        - "candidates" = exactly 3 similar English words
                        - "resolvedWord" = null
                        - "entries" = []

                        Output format example:
                        {
                            "inputWord": "run",
                            "candidates": [],
                            "resolvedWord": "run",
                            "entries": [
                                {
                                    "meaning": "to move fast",
                                    "japanese": "走る",
                                    "example": "I run every day."
                                },
                                {
                                    "meaning": "to operate or function",
                                    "japanese": "動く、作動する",
                                    "example": "This machine runs smoothly."
                                }
                            ]
                        }
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