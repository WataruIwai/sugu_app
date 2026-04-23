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

                        The user input word is: %s

                        The user will input one word.
                        You must always return a JSON object.

                        Rules:
                        1. If the input is a valid English word:
                        - "inputWord" = the user's original input
                        - "candidates" = []
                        - "resolvedWord" = the valid input word
                        - "entries" = an array of one or more objects
                        - Each object in "entries" must contain:
                            - "meaning_en" = English meaning
                            - "meaning_ja" = corresponding Japanese translation
                            - "example" = example sentence

                        2. If the input is misspelled or not a valid English word:
                        - "inputWord" = the user's original input
                        - "candidates" = exactly 3 similar English words
                        - "resolvedWord" = must use null
                        - "entries" = []

                        Output format example when the input is a valid English word:
                        {
                            "inputWord": "run",
                            "candidates": [],
                            "resolvedWord": "run",
                            "entries": [
                                {
                                    "meaning_en": "to move fast",
                                    "meaning_ja": "走る",
                                    "example": "I run every day."
                                },
                                {
                                    "meaning_en": "to operate or function",
                                    "meaning_ja": "動く、作動する",
                                    "example": "This machine runs smoothly."
                                }
                            ]
                        }

                        Output format example when the input is misspelled or not a valid English word:
                        {
                            "inputWord": "appe",
                            "candidates": ["apple", "apply", "ape"],
                            "resolvedWord": null,
                            "entries": []
                        }
                    """.formatted(word))
                .text(OpenAiResponse.class).build();

        StructuredResponse<OpenAiResponse> response = client.responses().create(params);
        OpenAiResponse result = response.output().stream()
            .flatMap(item -> item.message().stream())
            .flatMap(message -> message.content().stream())
            .flatMap(content -> content.outputText().stream())
            .findFirst()
            .orElseThrow(() -> new RuntimeException("No structured output found"));

        System.out.println(result);
        return result;
    }
}
