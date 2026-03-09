The **@preview/SurveyJS** operation renders interactive surveys using the Survey.js library.

Surveys are configured by means of Base64-encoded JSON strings in the input model.

§§§§

This operation allows you to embed complex, interactive forms and surveys directly into your ASP-chef recipe. It bridges the gap between data collection and logic-based processing.

#### How it works

The operation looks for atoms matching the specified **Predicate** (default: `__survey__`).
1. The first term of the atom is expected to be a Base64-encoded JSON string containing a valid Survey.js configuration (schema).
2. The survey is rendered in the output panel.
3. User responses are collected and transformed into ASP facts.

#### Configuration

A simple survey configuration (before Base64 encoding) might look like this:
```json
{
 "pages": [
  {
   "name": "page1",
   "elements": [
    {
     "type": "text",
     "name": "question1",
     "title": "What is your name?"
    }
   ]
  }
 ]
}
```

#### Collecting Responses

When a user completes the survey, the results are Base64-encoded and added to the output model using the **Output Predicate** (default: `__output__`).
- **Format**: `__output__("BASE64_JSON_ANSWERS")`.

You can then use a **JSON Path Plus** or **Search Models** ingredient to reason about the user's input.

#### Features

*   **Multi-Stage Expansion**: If enabled, mustache queries within the survey configuration are expanded using facts from the input model. This allows for dynamic surveys that adapt to previous results.
*   **Model Index**: Option to show which model the survey instance belongs to when multiple configurations are present.
*   **Persistent Data**: The survey answers are stored within the recipe state, allowing them to participate in the data flow of subsequent ingredients.

