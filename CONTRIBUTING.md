# Contributing to Pre-Viral Tweet Filter

Thank you for your interest in contributing to Pre-Viral Tweet Filter! This document provides guidelines and information for contributors.

## 🚀 Quick Start

1. **Fork the repository**
2. **Clone your fork**: `git clone https://github.com/tpwatson/previral-tweet-filter.git`
3. **Create a branch**: `git checkout -b feature/your-feature-name`
4. **Make your changes**
5. **Test thoroughly** on x.com
6. **Commit**: `git commit -m 'Add your feature'`
7. **Push**: `git push origin feature/your-feature-name`
8. **Open a Pull Request**

## 🛠️ Development Setup

### Prerequisites
- Chrome Browser (latest version)
- Basic knowledge of JavaScript
- Understanding of Chrome Extensions API
- Git

### Local Development
1. Clone the repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the project directory
5. Make changes to the code
6. Click the refresh icon on the extension to reload
7. Test on x.com

### File Structure
```
previral-tweet-filter/
├── manifest.json          # Extension configuration
├── content.js            # Main filtering logic (injected into x.com)
├── popup.js              # Settings UI logic
├── popup.html            # Settings interface
├── styles.css            # Global styles
├── README.md             # Project documentation
└── CONTRIBUTING.md       # This file
```

## 📝 Code Style Guidelines

### JavaScript
- Use meaningful variable and function names
- Add comments for complex logic
- Follow existing code patterns
- Use ES6+ features when appropriate
- Handle errors gracefully

### CSS
- Use descriptive class names
- Follow BEM methodology when possible
- Keep styles modular
- Use CSS custom properties for theming

### HTML
- Use semantic HTML elements
- Ensure accessibility (ARIA labels, etc.)
- Keep structure clean and readable

## 🧪 Testing Guidelines

### Manual Testing Checklist
Before submitting a PR, ensure:

- [ ] Extension loads without console errors
- [ ] All settings work correctly
- [ ] Tweet filtering functions properly
- [ ] UI updates in real-time
- [ ] Performance remains smooth
- [ ] Settings persist across browser sessions
- [ ] Works on different tweet types (text, media, etc.)

### Testing Different Scenarios
- Test with various engagement rates
- Test with different time thresholds
- Test whitelist functionality
- Test on different X/Twitter pages (home, profile, search)
- Test with high-volume feeds

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Browser version and OS**
2. **Extension version**
3. **Steps to reproduce**
4. **Expected behavior**
5. **Actual behavior**
6. **Console errors** (if any)
7. **Screenshots** (if relevant)

## 💡 Feature Requests

When suggesting features:

1. **Describe the problem** you're trying to solve
2. **Explain your proposed solution**
3. **Consider the impact** on performance and user experience
4. **Provide examples** if possible

## 🔧 Common Development Tasks

### Adding a New Filter
1. Add the filter logic to `content.js`
2. Add UI controls to `popup.html`
3. Add settings handling to `popup.js`
4. Update the README with documentation
5. Test thoroughly

### Modifying the UI
1. Update `popup.html` for structure
2. Update `styles.css` for styling
3. Update `popup.js` for interactions
4. Test on different screen sizes

### Performance Optimizations
1. Profile the extension using Chrome DevTools
2. Identify bottlenecks
3. Implement optimizations
4. Test impact on user experience

## 📋 Pull Request Guidelines

### Before Submitting
- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] No console errors
- [ ] Performance impact is considered

### PR Description
Include:
- **Summary** of changes
- **Motivation** for the change
- **Testing** performed
- **Screenshots** (if UI changes)
- **Breaking changes** (if any)

### Review Process
1. Automated checks must pass
2. At least one maintainer must approve
3. All conversations must be resolved
4. Changes may be requested before merging

## 🏷️ Issue Labels

We use the following labels to categorize issues:

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed
- `documentation` - Improvements or additions to documentation
- `performance` - Performance improvements
- `ui/ux` - User interface or experience changes

## 🎯 Good First Issues

These issues are perfect for new contributors:

- [ ] Add keyboard shortcuts
- [ ] Improve error messages
- [ ] Add loading indicators
- [ ] Optimize CSS selectors
- [ ] Add more filter options
- [ ] Improve accessibility
- [ ] Add unit tests

## 📞 Getting Help

If you need help:

1. **Check existing issues** for similar problems
2. **Search the documentation** for answers
3. **Open a new issue** with the `help wanted` label
4. **Join our discussions** in GitHub Discussions

## 🙏 Recognition

Contributors will be recognized in:
- The README file
- Release notes
- GitHub contributors page

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Pre-Viral Tweet Filter! 🚀 