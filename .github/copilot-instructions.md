This repository uses Angular.

Before changing code:
- Analyze package.json.
- Check angular.json.
- Follow the existing coding style.
- Detect whether Karma/Jasmine or Jest is used.
- Do not replace Jasmine tests with Jest.
- Ensure test coverage is 100% for all new code. If you are adding new things then add or adjust unit tests for it.
- In component test files, 
  - use the TestBed to create the component and its fixture. Do not use shallow rendering.
  - do not use template: '' in overrideComponent. Use the original template instead.
- Explain all breaking changes before modifying code.
- Keep the section of imports in the same order as it is in the original file. The base order should be:
  - Angular imports
  - Third-party imports
  - OneCX imports
  - Local imports
- Use english as the language for comments and documentation.
