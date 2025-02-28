//import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { markdownEncoding } from "@tool-form/markdown";
import { executeToolHandle } from "tool-handle";
import {
  createHttpContext,
  httpProtocolHandler,
  httpSecurityScheme,
} from "@tool-handle/http";

void suite("HTTP Handle", () => {
  const context = createHttpContext({
    encodings: [markdownEncoding],
    protocolHandlers: [httpProtocolHandler],
    securitySchemes: [httpSecurityScheme],
  });

  void test("executes github-list-repositories tool", async () => {
    const handle = {
      name: "github-list-repositories",
      description: "Lists public repositories for a GitHub user",
      parameters: {
        type: "object",
        properties: {
          username: {
            type: "string",
            description: "The GitHub username",
          },
          per_page: {
            type: "number",
            description: "Number of repositories to return per page (max 100)",
            default: 10,
          },
          sort: {
            type: "string",
            description:
              "The sort field: 'created', 'updated', 'pushed', or 'full_name'",
            enum: ["created", "updated", "pushed", "full_name"],
            default: "updated",
          },
          direction: {
            type: "string",
            description: "The direction of the sort: 'asc' or 'desc'",
            enum: ["asc", "desc"],
            default: "desc",
          },
        },
        required: ["username"],
      },
      protocol: "http",
      request: {
        method: "GET",
        url: {
          $uri: "https://api.github.com/users/{username}/repos{?per_page,sort,direction}",
        },
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Tool-Handle-Test",
        },
      },
      response: {
        "200": {
          $encode: "markdown",
          $block: [
            "# GitHub Repositories for {{parameters.username}}",
            "Found {{body.length}} repositories",

            {
              $each: "$.body.*",
              $as: "repo",
              $block: [
                "## {{repo.name}}",
                {
                  $when: "$.repo.description",
                  $blockquote: "{{repo.description}}",
                },
                {
                  $ul: [
                    {
                      $inline: [
                        "**Language**: ",
                        {
                          $if: "$.repo.language",
                          $then: "`{{repo.language}}`",
                          $else: "_None specified_",
                        },
                      ],
                    },
                    "**Stars**: {{repo.stargazers_count}}",
                    "**Forks**: {{repo.forks_count}}",
                    "**Open Issues**: {{repo.open_issues_count}}",
                    "**Created**: {{repo.created_at}}",
                    "**Last Updated**: {{repo.updated_at}}",
                    {
                      $if: "$.repo.homepage",
                      $then:
                        "**Homepage**: [{{repo.homepage}}]({{repo.homepage}})",
                    },
                    {
                      $when: "$.repo.topics.length > 0",
                      $inline: [
                        "**Topics:** ",
                        {
                          $: "repo.topics",
                          $join: ", ",
                        },
                      ],
                    },
                    "**Repository URL**: [{{repo.html_url}}]({{repo.html_url}})",
                  ],
                },
              ],
            },

            "## API Response Details",
            {
              $blockquote: {
                $inline: [
                  "Status: **{{status}} {{statusText}}**\n",
                  "Rate Limit: ",
                  "{{headers['x-ratelimit-remaining']}}",
                  "/",
                  "{{headers['x-ratelimit-limit']}}",
                ],
              },
            },

            {
              $when: "$.parameters.per_page < $.body.length",
              $p: "This response is paginated. Use additional pages to view more repositories.",
            },
          ],
        },
        "404": {
          $encode: "markdown",
          $block: [
            "# Error: User Not Found",
            {
              $blockquote:
                "The GitHub user **{{parameters.username}}** could not be found.",
            },
            "Please verify the username and try again.",
            "**Status**: {{status}} {{statusText}}",
          ],
        },
        "403": {
          $encode: "markdown",
          $block: [
            "# Error: Rate Limited",
            {
              $blockquote: "GitHub API rate limit exceeded.",
            },
            "**Status**: {{status}} {{statusText}}",
            {
              $when: "$.headers['x-ratelimit-reset']",
              $p: "Rate limit will reset at: {{headers['x-ratelimit-reset']}}",
            },
          ],
        },
        default: {
          $encode: "markdown",
          $block: [
            "# Error: {{status}} {{statusText}}",
            {
              $blockquote:
                "An unexpected error occurred while accessing the GitHub API.",
            },
            {
              $when: "$.body.message",
              $p: "**Message**: {{body.message}}",
            },
            {
              $lang: "json",
              $code: {
                $encode: "json",
                $indent: 2,
                $: "body",
              },
            },
          ],
        },
      },
    } as const;
    const result = await executeToolHandle(context, handle, {
      username: "toolcog",
      per_page: 5,
      sort: "updated",
      direction: "desc",
    });
    console.log(result);
  });
});
