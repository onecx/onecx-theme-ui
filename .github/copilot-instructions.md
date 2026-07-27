This repository uses Angular.

Before changing code:
- Analyze package.json.
- Check angular.json.
- Follow the existing coding style.
- Detect whether Jasmine/Karma or Jest is used. Do not change the testing framework. If you are adding new tests, use the same testing framework as the existing tests.
- In component files,
  - check the use of imported modules and components. Remove unused imports. Some module/component/class is imported to be used in the template. Do not remove them.
  - use the OnPush change detection strategy.
  - use the async pipe in the template instead of subscribing in the component.
  - use signals instead of BehaviorSubject or Subject for state management.
  - use the takeUntilDestroyed operator to unsubscribe from observables.
  - after you change the component code, check the template for any changes needed. If you change the component's public API, check all usages of the component in the project and update them accordingly.
  - after you change the component code, check the component's unit test file for any changes needed. 100% test coverage is required for all new code. If you are adding new things then add or adjust unit tests for it.
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
