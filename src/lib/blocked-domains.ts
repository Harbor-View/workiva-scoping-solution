export const BLOCKED_DOMAINS = new Set([
  // Google
  "gmail.com", "googlemail.com",
  // Microsoft
  "hotmail.com", "hotmail.co.uk", "hotmail.fr", "hotmail.de", "hotmail.es", "hotmail.it",
  "outlook.com", "outlook.co.uk", "outlook.fr", "outlook.de", "outlook.es", "outlook.it",
  "live.com", "live.co.uk", "live.fr", "live.de", "live.es", "live.it",
  "msn.com", "passport.com",
  // Yahoo
  "yahoo.com", "yahoo.co.uk", "yahoo.fr", "yahoo.de", "yahoo.es", "yahoo.it",
  "yahoo.co.jp", "yahoo.com.au", "yahoo.com.br", "yahoo.com.mx", "yahoo.ca",
  "ymail.com", "rocketmail.com",
  // Apple
  "icloud.com", "me.com", "mac.com",
  // AOL / Verizon
  "aol.com", "aim.com", "verizon.net", "att.net", "sbcglobal.net",
  // Other major
  "protonmail.com", "proton.me", "pm.me",
  "zoho.com",
  "mail.com", "email.com", "usa.com", "myself.com", "consultant.com",
  "iname.com", "cheerful.com", "hailmail.net",
  "inbox.com",
  "fastmail.com", "fastmail.fm",
  "tutanota.com", "tuta.io",
  "guerrillamail.com", "mailinator.com", "trashmail.com", "yopmail.com",
  "temp-mail.org", "throwam.com", "sharklasers.com", "guerrillamailblock.com",
  // Regional
  "web.de", "gmx.de", "gmx.com", "gmx.net", "gmx.at", "gmx.ch",
  "t-online.de", "freenet.de", "arcor.de",
  "orange.fr", "wanadoo.fr", "free.fr", "sfr.fr", "laposte.net",
  "libero.it", "virgilio.it", "tin.it", "tiscali.it",
  "mail.ru", "yandex.ru", "yandex.com", "rambler.ru", "inbox.ru", "bk.ru", "list.ru",
  "qq.com", "163.com", "126.com", "sina.com", "sohu.com", "foxmail.com",
  "naver.com", "daum.net", "hanmail.net",
  "rediffmail.com", "indiatimes.com",
  "terra.com.br", "bol.com.br", "uol.com.br",
  // ISP/Cable
  "comcast.net", "charter.net", "cox.net", "earthlink.net", "roadrunner.com",
  "bellsouth.net", "optonline.net", "centurytel.net", "windstream.net",
  "embarqmail.com", "twc.com", "spectrum.net",
  // Misc consumer
  "excite.com", "juno.com", "netzero.com", "lycos.com",
  "hushmail.com", "safe-mail.net",
  "mailfence.com",
  "runbox.com",
  "posteo.de",
  "dispostable.com", "spamgourmet.com",
]);

export function isCorporateEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return !BLOCKED_DOMAINS.has(domain);
}
