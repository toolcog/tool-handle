---
title: Command Handle
author: Chris Sachs
date: 2024-12
slug: draft-csachs-command-handle-00
---

# Command Handle

## Abstract

This document specifies the Command Handle type for Tool Augmented Generation (TAG), enabling AI applications to safely execute command-line operations through a standardized interface. The specification defines how commands are described semantically and executed safely, with particular focus on environment isolation, working directory management, and I/O stream handling. A complementary CLI encoding for Tool Form enables structured argument handling, improving security and composability through automatic escaping and parameter transformation.

## Table of Contents

1. [Introduction](#1-introduction)  
   1.1. [Purpose](#11-purpose)  
   1.2. [Scope](#12-scope)  
   1.3. [Terminology](#13-terminology)
2. [Command Handle Type](#2-command-handle-type)  
   2.1. [Structure](#21-structure)
3. [Command Execution](#3-command-execution)  
   3.1. [Working Directory](#31-working-directory)  
   3.2. [Environment Variables](#32-environment-variables)  
   3.3. [I/O Streams](#33-io-streams)  
   3.4. [Execution Requirements](#34-execution-requirements)
4. [Arguments Encoding](#4-arguments-encoding)  
   4.1. [Object Transform](#41-object-transform)  
   4.2. [Value Transform](#42-value-transform)  
   4.3. [Domain Directives](#43-domain-directives)
5. [Security Considerations](#5-security-considerations)  
   5.1. [Command Validation](#51-command-validation)  
   5.2. [Environment Isolation](#52-environment-isolation)  
   5.3. [Platform Security](#53-platform-security)
6. [IANA Considerations](#6-iana-considerations)  
   6.1. [Handle Type Registration](#61-handle-type-registration)  
   6.2. [Encoding Registration](#62-encoding-registration)
7. [References](#7-references)  
   7.1. [Normative References](#71-normative-references)  
   7.2. [Informative References](#72-informative-references)

- [Appendix A. Examples](#appendix-a-examples)
  - [A.1. Basic Command Execution](#a1-basic-command-execution)
  - [A.2. Command with Tool Form](#a2-command-with-json-form)
  - [A.3. Environment Management](#a3-environment-management)

## 1. Introduction

This document specifies the Command Handle type for Tool Augmented Generation (TAG) [TOOLHAND], enabling AI applications to safely execute command-line operations through a standardized interface. The specification defines how commands are described semantically and executed safely, while providing structured argument handling through a complementary CLI encoding for Tool Form [TOOLFORM].

### 1.1. Purpose

Command-line tools are essential for system automation and management. However, enabling AI applications to safely execute commands presents several technical challenges:

- **Command Description**: Commands need semantic descriptions that LLMs can understand and use effectively
- **Argument Handling**: Command arguments must be properly escaped and validated
- **Environment Management**: Working directories and environment variables require careful handling
- **Platform Differences**: Command execution varies across operating systems

This specification addresses these challenges by defining a standardized way to describe and execute command-line operations within the Tool Handle framework.

### 1.2. Scope

This document specifies:

- The structure and requirements for Command Handles
- How commands are executed safely
- Environment and I/O stream management
- A CLI encoding for structured argument handling

The following aspects are explicitly out of scope:

- Shell-specific features (pipelines, redirection)
- Specific security policies
- Implementation strategies
- Programming language bindings

### 1.3. Terminology

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in BCP 14 [RFC2119] [RFC8174] when, and only when, they appear in all capitals, as shown here.

The terminology defined in Tool Handle [TOOLHAND] applies to this document. Additionally:

command
: A program or executable that can be run on the operating system.

argument
: A string value passed to a command that affects its behavior.

working directory
: The directory from which a command is executed, affecting how relative paths are resolved.

environment variable
: A named value in the process environment that can affect command behavior.

token
: A string value that represents a single command-line argument, which may require escaping to preserve its meaning when passed to a command.

token array
: An ordered sequence of tokens that together form a complete command-line argument list.

## 2. Command Handle Type

The Command Handle type extends the base Tool Handle specification [TOOLHAND] to enable standardized command-line operations. This section defines the structure and requirements specific to command execution.

### 2.1. Structure

A Command Handle extends the base Tool Handle [TOOLHAND] with fields that define how to execute a command-line program. A Command Handle MUST include a `command` field. The fields are:

- `command`: A Tool Form that yields a string naming an executable program or command.

- `arguments`: A Tool Form that yields either a string or an array of strings. When an array is provided, each element MUST be a string.

- `directory`: A Tool Form that yields a string specifying the working directory for command execution.

- `environment`: A Tool Form that yields an object mapping environment variable names to their values.

- `io`: An object controlling stream handling for the command's standard input, output, and error streams. The structure of this object is defined in Section 3.3.

## 3. Command Execution

This section defines how Command Handles are executed, including working directory management, environment variables, and I/O streams.

### 3.1. Working Directory

When a `directory` field is present, implementations MUST:

- Validate the directory exists and is accessible
- Set the directory as the working directory before command execution
- Restore the original working directory after execution
- Handle directory access errors appropriately

When no `directory` field is present, implementations MUST execute the command in their current working directory.

### 3.2. Environment Variables

When an `environment` field is present, implementations MUST:

- Start with a clean environment
- Add only the variables specified in the environment object
- Validate all variable names are valid for the target platform
- Prevent access to sensitive system variables
- Clean up the environment after execution

When no `environment` field is present, implementations MUST still execute the command with a clean environment.

### 3.3. I/O Streams

The `io` field controls how standard streams are handled. When present, it MUST be an object with the following fields:

- `stdin`: A Tool Form that yields either a string or a binary buffer to pass to the command's standard input
- `stdout`: A string specifying how to handle standard output: "pipe" (default), "ignore", or "inherit"
- `stderr`: A string specifying how to handle standard error: "pipe" (default), "ignore", or "inherit"
- `encoding`: A string specifying the character encoding for text streams (default: "utf8")

When no `io` field is present, implementations MUST:

- Leave standard input closed
- Capture standard output and standard error as UTF-8 text
- Make the captured output available in the command's result

### 3.4. Execution Requirements

When executing commands, implementations MUST:

- Evaluate all Tool Form fields to their final values
- Validate the command exists and is executable
- Set up the execution environment (working directory, environment variables, streams)
- Execute the command with the specified arguments
- Clean up resources after execution completes
- Return the command's exit code and any captured output

Implementations MUST NOT:

- Execute shell metacharacters or perform shell expansion
- Allow access to sensitive environment variables
- Execute relative commands without a full path unless found in PATH
- Continue execution if any validation step fails

## 4. Arguments Encoding

This section defines the "args" encoding for Tool Form, which enables safe and structured generation of command-line arguments. The encoding bridges the gap between JSON's structured data model and the flat string arrays required by command-line interfaces, while preventing common security issues like argument injection and escaping errors.

The encoding operates through a two-phase transformation process that maintains clear semantics while enabling natural expression of command-line idioms. JSON objects become structured argument lists through the Object Transform, while individual values are converted to argument arrays through the Value Transform. This separation enables precise control over argument generation while preserving JSON's natural structure.

### 4.1. Object Transform

The Object Transform converts JSON objects into command-line argument arrays. It processes each property in order, handling subcommands, flags, and their values according to command-line conventions.

If an object contains exactly one Domain Directive, return the result of applying that directive's transformation rules. If it contains multiple Domain Directives, return an error.

For objects without Domain Directives, implementations MUST process properties in the order specified by [RFC8259]. Property names MUST match one of these patterns:

- `[A-Za-z0-9][-A-Za-z0-9_]*` for subcommands and positional arguments
- `[-+][A-Za-z0-9][-A-Za-z0-9_]*(=)?` for flag arguments

The Object Transform applies the Value Transform to each property's value, then processes the property according to its name.

Properties starting with "-" or "+" define flags:

- Single-character flags with transformed value `["true"]` become a flag name
- Names ending in "=" concatenate the flag name with the transformed values joined by the Argument Joining Algorithm
- Other flags emit the flag name followed by each transformed value

Properties without a leading "-" or "+" define subcommands or positional arguments:

- Emit the property name
- For object values, apply the Object Transform recursively
- For other values, emit each token from the Value Transform

The Argument Joining Algorithm escapes backslashes and commas using `\\` and `\,`, respectively, then joins the escaped values with commas.

For example, this template demonstrates how subcommands, flags, and nested structures are transformed:

```json
{
  "docker": {
    "run": {
      "-i": true,
      "-t": true,
      "-p": "8080",
      "--name=": "test-container",
      "--label=": ["app=myapp", "env=prod,debug"],
      "ubuntu": {
        "latest": null,
        "bash": null
      }
    }
  }
}
```

Produces: `["docker", "run", "-it", "-p", "8080", "--name=test-container", "--label=app=myapp,env=prod\\,debug", "ubuntu", "latest", "bash"]`.

This demonstrates:

- Nested subcommand handling (`docker run`)
- Single-character flag combining (`-i -t` becomes `-it`)
- Flag with value (`-p 8080`)
- Long flag with joined value (`--name=test-container`)
- Long flag with escaped comma in value (`--label=app=myapp,env=prod\,debug`)
- Nested command sequence (`ubuntu latest bash`)

The Object Transform and Value Transform work together recursively to handle nested structures. When the Value Transform encounters an object, it applies the Object Transform to that object. When the Object Transform processes a property value, it applies the Value Transform to that value.

### 4.2. Value Transform

The Value Transform converts JSON values into command-line arguments. When processing a value, implementations MUST apply the following rules:

- Null and false values return an empty array
- True values return `["true"]`
- Numbers return their canonical string representation as a single-element array
- Strings return a single-element array containing the unmodified string
- Arrays transform each element recursively and concatenate all results in order
- Objects are processed through the Object Transform from Section 4.1

Arguments MUST contain only characters from these ranges:

- `0x21`-`0x22`, excluding space
- `0x24`-`0x26`, excluding `#`
- `0x28`-`0x3B`, excluding `'`
- `0x3D`, excluding `<` and `>`
- `0x3F`-`0x5B`, excluding `>`
- `0x5D`-`0x60`, excluding `\`
- `0x7B`-`0x7E`

This ensures all shell metacharacters, quotes, spaces, and control characters are excluded while allowing normal alphanumeric text and common punctuation. The transform MUST fail if any argument contains characters outside these ranges.

For example, basic JSON types transform directly to their string representations:

```json
{
  "str": "hello",
  "num": 42,
  "bool": true,
  "empty": null
}
```

Produces: `["str", "hello", "num", "42", "bool", "true"]`.

Nested objects and arrays enable natural expression of complex commands:

```json
{
  "git": {
    "commit": {
      "-a": true,
      "-m": ["Initial commit", "More details"],
      "--": ["file1.txt", "file2.txt"]
    }
  }
}
```

Produces: `["git", "commit", "-a", "-m", "Initial commit", "More details", "--", "file1.txt", "file2.txt"]`.

This demonstrates the recursive relationship between Value Transform and Object Transform:

- The top-level object is processed by Object Transform
- Property values are processed by Value Transform
- When Value Transform encounters an object, it applies Object Transform
- Arrays are flattened into the argument sequence
- Property order is preserved throughout

Docker commands illustrate the full range of transformation capabilities:

```json
{
  "docker": {
    "run": {
      "-i": true,
      "-t": true,
      "-p": "8080",
      "--name=": "test-container",
      "--label=": ["app=myapp", "env=prod,debug"],
      "ubuntu": {
        "latest": null,
        "bash": null
      }
    }
  }
}
```

Produces: `["docker", "run", "-it", "-p", "8080", "--name=test-container", "--label=app=myapp,env=prod\\,debug", "ubuntu", "latest", "bash"]`.

The transformation handles:

- Nested subcommand handling (`docker run`)
- Single-character flag combining (`-i -t` becomes `-it`)
- Flag with value (`-p 8080`)
- Long flag with joined value (`--name=test-container`)
- Long flag with escaped comma in value (`--label=app=myapp,env=prod\,debug`)
- Nested command sequence (`ubuntu latest bash`)

### 4.3. Domain Directives

Domain directives provide specialized argument handling capabilities while maintaining consistent composition with the base transformation rules. Each directive defines specific rules for converting its value into an argument sequence.

#### The $args Directive

The `$args` directive provides direct control over argument sequences, bypassing the standard transformation rules. This escape hatch is crucial when argument structure must be preserved exactly, such as when using "--" to separate flags from file arguments.

Each property in the directive's value represents an argument that must appear exactly in the output sequence. This direct preservation is essential for cases where the standard transformation rules would interfere with required argument patterns.

Implementations MUST:

1. Apply the Value Transform to the directive's value
2. Verify each argument contains only allowed characters as defined in Section 4.2
3. Return the arguments in order, preserving their exact sequence

For example, many Unix commands use "--" to indicate that subsequent arguments are file paths rather than options:

```jsonc
{
  "command": {
    "$args": ["--", "file.txt"],
  },
}
```

Produces: `["command", "--", "file.txt"]`.

This preserves the argument separator pattern that tells the command to treat "file.txt" as a path, even if it begins with a dash.

#### The $flags Directive

The `$flags` directive provides structured handling of command-line flags, with special support for common Unix idioms like single-character flag combining. Its value must be an object mapping flag names to their values.

Property names in the flags object MUST match the pattern:

- `[-+][A-Za-z0-9][-A-Za-z0-9_]*(=)?` for all flag arguments

Each property value undergoes the Value Transform with these rules:

- Single-character flags with value `["true"]` are collected for combining
- For names ending in "=", the value is joined directly to the flag name
- For all other flags, the value follows the flag as a separate argument

The output sequence preserves semantic relationships while optimizing for common patterns:

- Combined single-character flags appear first (e.g., "-abc")
- Remaining flags follow in their original order
- Each flag's value immediately follows its name
- Joined flags maintain their combined form

For example, the directive handles both simple flag combining and complex flag patterns in a single transformation:

```json
{
  "command": {
    "$flags": {
      "a": true,
      "b": true,
      "v": true,
      "message": "Commit message",
      "author=": "Alice"
    }
  }
}
```

Produces: `["command", "-abv", "--message", "Commit message", "--author=Alice"]`.

The transformation combines single-character flags into "-abv", handles long-form flags with values, and preserves the special "=" syntax for joined values.

#### The $repeat Directive

The `$repeat` directive enables systematic flag repetition, which is common in some command-line interfaces. Its value must be an object mapping flag names to arrays of values.

Property names in the flags object MUST match the pattern `[-+][A-Za-z0-9][-A-Za-z0-9_]*(=)?` for all flag arguments. Each property value MUST be an array. The implementation processes properties in input order. For each property, it processes array elements in sequence, performing these actions:

- Apply the Value Transform to the element
- For flag names ending in "=", join the first result token directly to the flag name using the Argument Joining Algorithm
- For other flags, emit the flag name followed by the result tokens

For example, a compiler invocation demonstrates flag repetition with both simple and joined values:

```json
{
  "command": {
    "$repeat": {
      "-I": ["include1", "include2"],
      "--define=": ["DEBUG=1", "VERSION=2"],
      "--optional=": []
    }
  }
}
```

Produces: `["command", "-I", "include1", "-I", "include2", "--define=DEBUG=1", "--define=VERSION=2"]`.

Empty arrays result in zero repetitions of their flag. Flag/value pairs are emitted consecutively, maintaining the input order of both properties and array elements.

## 5. Security Considerations

Command execution presents significant security risks. Implementations MUST enforce the following security boundaries:

### 5.1. Command Validation

Implementations MUST:

- Validate the command exists before execution
- Require absolute paths or commands in PATH
- Verify the command is executable by the current user
- Prevent execution of shell metacharacters
- Fail if any validation step fails

Additionally, to prevent command injection attacks, implementations MUST:

- Validate all arguments before shell expansion
- Ensure argument arrays cannot be interpreted as shell syntax
- Apply appropriate escaping for the target platform
- Prevent argument strings from being interpreted as flags
- Block execution if validation fails

The "args" encoding provides hygienic token generation, but implementations must still protect against malicious templates that might attempt to exploit command execution through carefully crafted argument values.

### 5.2. Environment Isolation

Implementations MUST:

- Execute commands with clean environments
- Prevent access to sensitive system variables
- Validate all environment variable names
- Validate all environment variable values
- Clean up environments after execution

### 5.3. Platform Security

Implementations MUST:

- Enforce platform-specific security boundaries
- Respect filesystem access controls
- Handle platform-specific errors appropriately
- Prevent privilege escalation
- Clean up all resources after execution

## 6. IANA Considerations

### 6.1. Handle Type Registration

IANA is requested to register the following Handle Type in the Tool Handle Handle Type Registry:

Name: command
Description: Command-line tool handle that enables standardized command execution in Tool Augmented Generation systems
Reference: This document (Section 2)
Change Controller: IETF
Contact: IETF Command Handle Working Group <ch-wg@ietf.org>

### 6.2. Encoding Registration

IANA is requested to register the following Encoding in the Tool Form Encoding Registry:

Name: args
Description: Command-line argument encoding that formats structured arguments into command-line strings
Media Type: text/plain
Reference: This document (Section 4)

## 7. References

### 7.1. Normative References

[RFC2119] Bradner, S., "Key words for use in RFCs to Indicate
Requirement Levels", BCP 14, RFC 2119,
DOI 10.17487/RFC2119, March 1997,
<https://www.rfc-editor.org/info/rfc2119>.

[RFC8174] Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC
2119 Key Words", BCP 14, RFC 8174, DOI 10.17487/RFC8174,
May 2017, <https://www.rfc-editor.org/info/rfc8174>.

[TOOLHAND] Sachs, C., "Tool Handle",
draft-csachs-tool-handle-00, December 2024.

[TOOLFORM] Sachs, C., "Tool Form",
draft-csachs-tool-form-00, December 2024.

### 7.2. Informative References

[RFC3986] Berners-Lee, T., Fielding, R., and L. Masinter,
"Uniform Resource Identifier (URI): Generic Syntax",
STD 66, RFC 3986, DOI 10.17487/RFC3986,
January 2005, <https://www.rfc-editor.org/info/rfc3986>.

## Appendix A. Examples

### A.1. Basic Command Execution

This example demonstrates basic command execution with working directory and environment management:

```json
{
  "name": "build-project",
  "description": "Builds the project using make",
  "handle": "command",
  "command": "make",
  "arguments": ["all"],
  "directory": "src",
  "environment": {
    "CFLAGS": "-O2",
    "MAKEFLAGS": "-j4"
  }
}
```

### A.2. Command with Tool Form

This example shows how Tool Form enables dynamic command construction:

```json
{
  "name": "git-commit",
  "description": "Commits changes with a message",
  "handle": "command",
  "command": "git",
  "arguments": {
    "$encode": "args",
    "flags": {
      "message": { "$": "message" },
      "author": { "$": "author" }
    },
    "positional": { "$": "files[*]" }
  }
}
```

### A.3. Environment Management

This example demonstrates comprehensive environment management:

```json
{
  "name": "deploy-service",
  "description": "Deploys a service with environment configuration",
  "handle": "command",
  "command": "./deploy.sh",
  "directory": { "$": "deploy.path" },
  "environment": {
    "SERVICE_NAME": { "$": "service.name" },
    "SERVICE_PORT": { "$": "service.port" },
    "DB_URL": { "$": "database.url" },
    "API_KEY": { "$": "credentials.api_key" }
  },
  "io": {
    "stdout": "file",
    "stderr": "pipe",
    "encoding": "utf8"
  }
}
```
