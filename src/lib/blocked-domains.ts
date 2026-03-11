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

  // Big 4 & Large Accounting Firms
  "deloitte.com", "deloitte.co.uk", "deloitte.ca", "deloitte.com.au", "deloitte.de",
  "deloitte.fr", "deloitte.nl", "deloitte.co.za", "deloitte.jp", "deloitte.cn",
  "ey.com",
  "kpmg.com", "kpmg.co.uk", "kpmg.ca", "kpmg.com.au", "kpmg.de",
  "pwc.com", "pwcglobal.com",
  "bdo.com", "bdo.co.uk", "bdo.ca", "bdo.com.au",
  "rsmus.com",
  "grantthornton.com", "gt.com",
  "crowe.com",
  "mossadams.com",
  "cbiz.com",
  "cohnreznick.com",
  "bakertilly.com",
  "plantemoran.com",
  "wipfli.com",
  "eidebailly.com",
  "forvis.com",
  "marcumllp.com",
  "citrincooperman.com",
  "berrydunn.com",
  "pkfod.com",
  "armanino.com",
  "claconnect.com",
  "sikich.com",
  "aprio.com",
  "schgroup.com",
  "lgt-cpa.com",
  "andersen.com",

  // Global Consulting Firms
  "accenture.com",
  "capgemini.com",
  "cognizant.com",
  "infosys.com",
  "tcs.com",
  "wipro.com",
  "hcltech.com",
  "dxc.com",
  "atos.net",
  "cgi.com",
  "nttdata.com",
  "ltimindtree.com",

  // Boutique & Specialized Consultancies
  "riveron.com",
  "protiviti.com",
  "fticonsulting.com",
  "alvarezandmarsal.com",
  "hurongroup.com", "huronconsultinggroup.com",
  "navigant.com",
  "westmonroepartners.com",
  "slalombuild.com", "slalom.com",
  "crosscountry-consulting.com",
  "embarkwithus.com",
  "8020consulting.com",
  "constellationr.com",
  "trintech.com",
  "blackline.com",
  "onestreamsoftware.com",
  "wolterskluwer.com",
  "thomsonreuters.com",
  "oracle.com",
  "sap.com",

  // Additional disposable / temporary email
  "tempmail.com", "10minutemail.com", "throwaway.email",
  "fakeinbox.com", "maildrop.cc", "mailnesia.com",
  "getairmail.com", "discard.email", "mailcatch.com",

  // Debug / test
  "wadehaysracing.com",
]);

export function isCorporateEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return !BLOCKED_DOMAINS.has(domain);
}
