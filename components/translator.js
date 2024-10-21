const americanOnly = require("./american-only.js");
const americanToBritishSpelling = require("./american-to-british-spelling.js");
const americanToBritishTitles = require("./american-to-british-titles.js");
const britishOnly = require("./british-only.js");

const reverseDict = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [v, k]));

class Translator {
  toBritishEnglish(text) {
    const dict = { ...americanOnly, ...americanToBritishSpelling };
    const titles = americanToBritishTitles;
    const timeRegex = /([1-9]|1[012]):[0-5][0-9]/g;
    return this.translate(text, dict, titles, timeRegex, "toBritish") || text;
  }

  toAmericanEnglish(text) {
    const dict = { ...britishOnly, ...reverseDict(americanToBritishSpelling) };
    const titles = reverseDict(americanToBritishTitles);
    const timeRegex = /([1-9]|1[012]).[0-5][0-9]/g;
    return this.translate(text, dict, titles, timeRegex, "toAmerican") || text;
  }

  translate(text, dict, titles, timeRegex, locale) {
    const lowerText = text.toLowerCase();
    const matchesMap = this.findMatches(lowerText, dict, titles, timeRegex, locale);

    // No matches, return null
    if (Object.keys(matchesMap).length === 0) return null;

    // Return the translated text and its highlighted version
    return [
      this.replaceAll(text, matchesMap),
      this.replaceAllWithHighlight(text, matchesMap),
    ];
  }

  findMatches(text, dict, titles, timeRegex, locale) {
    const matchesMap = {};

    // Find titles
    for (const [key, value] of Object.entries(titles)) {
      if (text.includes(key)) {
        matchesMap[key] = value.charAt(0).toUpperCase() + value.slice(1);
      }
    }

    // Find spaced word matches
    for (const [key, value] of Object.entries(dict)) {
      if (key.includes(" ") && text.includes(key)) {
        matchesMap[key] = value;
      }
    }

    // Find individual word matches
    text.match(/\b(\w+([-']\w+)*)\b/g).forEach((word) => {
      if (dict[word]) matchesMap[word] = dict[word];
    });

    // Find time matches
    const matchedTimes = text.match(timeRegex);
    if (matchedTimes) {
      matchedTimes.forEach((time) => {
        matchesMap[time] = locale === "toBritish" ? time.replace(":", ".") : time.replace(".", ":");
      });
    }

    return matchesMap;
  }

  replaceAll(text, matchesMap) {
    const regex = new RegExp(Object.keys(matchesMap).join("|"), "gi");
    return text.replace(regex, (matched) => matchesMap[matched.toLowerCase()]);
  }

  replaceAllWithHighlight(text, matchesMap) {
    const regex = new RegExp(Object.keys(matchesMap).join("|"), "gi");
    return text.replace(regex, (matched) => `<span class="highlight">${matchesMap[matched.toLowerCase()]}</span>`);
  }
}

module.exports = Translator;
