# Domino's Australia Website Testing Project

Comprehensive automated testing of Domino's Australia website using Playwright MCP browser automation.

## 📋 Project Overview

This project contains automated testing reports for the Domino's Australia website, focusing on:
- Broken link detection and validation
- Store finder functionality and edge case testing
- Security vulnerability assessment
- Input validation testing

## 📊 Reports

### [Broken Links Report](broken-links-report-2025-10-23.md)
**Date:** October 23, 2025

Comprehensive analysis of all links on the Domino's Australia website.

**Key Findings:**
- ✅ 30+ links tested
- ❌ 1 critical broken link identified (outdated iTunes App Store URL)
- 📈 ~97% success rate

**Critical Issue:** Apple App Store link using deprecated `itunes.apple.com` format needs updating to `apps.apple.com`

### [Store Finder Edge Case Testing](store-search.md)
**Date:** October 23, 2025

In-depth testing of the store finder search box functionality.

**Test Results:**
- ✅ 8/8 tests passed
- 🔒 100% security pass rate
- ✨ Zero vulnerabilities found

**Tests Performed:**
- Valid input handling
- Special characters
- SQL injection attempts
- XSS (Cross-Site Scripting) attempts
- Buffer overflow testing
- Whitespace handling
- Partial postcode validation
- Unicode/international characters

## 🛠️ Tools & Technologies

- **Playwright MCP**: Browser automation and testing
- **HTTP Validation**: Link verification and status checking
- **Security Testing**: SQL injection, XSS, and input validation
- **Markdown**: Documentation format

## 🎯 Testing Methodology

1. **Automated Browser Navigation**: Using Playwright MCP for realistic user interaction
2. **Link Extraction**: Comprehensive snapshot of page structure
3. **HTTP Validation**: Individual link testing for response codes
4. **Security Analysis**: Injection attack simulation and input fuzzing
5. **Edge Case Testing**: Boundary conditions and unusual inputs

## 📈 Results Summary

| Test Category | Pass Rate | Critical Issues |
|--------------|-----------|-----------------|
| Link Validation | 97% | 1 broken link |
| Security Testing | 100% | 0 vulnerabilities |
| Edge Cases | 100% | 0 failures |

## 🔍 Key Findings

### Strengths
- ✅ Robust security implementation
- ✅ Excellent input validation
- ✅ Proper error handling
- ✅ Most external links maintained properly

### Areas for Improvement
- ⚠️ Update outdated Apple App Store URL
- 💡 Implement automated link monitoring
- 💡 Quarterly external link audits

## 📝 Report Details

### Broken Links Report
- **Pages Tested**: Homepage, menu, store finder, app page, contact pages, and more
- **External Links**: Social media, app stores, partner sites
- **Validation Method**: HTTP GET requests with status code verification

### Store Finder Testing
- **Component**: Search box input field
- **Security Focus**: Injection attacks, XSS, overflow attempts
- **Usability Focus**: Edge cases, special characters, internationalization

## 🚀 Future Enhancements

- [ ] Automated CI/CD integration for continuous testing
- [ ] Performance monitoring and load testing
- [ ] Accessibility (a11y) testing
- [ ] Mobile responsiveness validation
- [ ] API endpoint testing

## 📄 License

This is a testing demonstration project.

## 👤 Author

**Adis Suffian**
- GitHub: [@adissuffian](https://github.com/adissuffian)

---

*Last Updated: October 23, 2025*
