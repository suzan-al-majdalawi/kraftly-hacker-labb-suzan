# Säkerhetsgranskning – Kraftly Hackerlabb

## 1. IDOR – obehörig åtkomst till andra kunders fakturor

**Hål:** En inloggad kund kan läsa en annan kunds fakturor genom att ändra parametern `customerNo`.

**OWASP:** A01:2021 – Broken Access Control.

**Bevis:** Logga in som Anna och kör:
```powershell
curl.exe -i "http://localhost:4000/api/invoices?customerNo=K-208811" `
  -H "Authorization: Bearer $token"
```
Svaret innehöll fakturor för kundnummer `K-208811`. Bekräfta att samma `$token` tillhör Anna innan resultatet lämnas in.

**Fix:** Kontrollera på servern att kunden bara kan läsa sina egna fakturor och neka åtkomst till andra kunders fakturor.

## 2. Mass assignment – ändring av användarens roll

**Hål:** API:et kopierar godtyckliga fält från användarens begäran till användarobjektet, vilket kan göra det möjligt att ändra rollen till `support`.

**OWASP:** A01:2021 – Broken Access Control.

**Bevis:** Skicka en `PUT`-begäran till `/api/user` med JSON-kroppen `{"role":"support"}` och kontrollera om rollen ändras. Testet ska dokumenteras med det faktiska svaret.

**Fix:** Tillåt endast uttryckligen godkända profilfält och förbjud ändringar av exempelvis `role`, `id` och `customerNo` från kundens profilbegäran.

## 3. XSS – osäker visning av meddelanden

**Hål:** Flyttanmälans uppgifter infogas i HTML utan säker HTML-escaping, vilket kan möjliggöra Cross-Site Scripting om meddelandet visas som betrodd HTML.

**OWASP:** A03:2021 – Injection.

**Bevis:** Skicka ett ofarligt HTML-testvärde i flyttanmälans adressfält och kontrollera om det renderas som HTML i meddelandet. Dokumentera resultatet från webbläsaren.

**Fix:** Visa användaruppgifter som text och använd en väl underhållen HTML-sanerare om HTML måste tillåtas.

## 4. Svag JWT-hemlighet

**Hål:** JWT-signeringen använder den hårdkodade hemligheten `kraftly`, vilket gör signeringsnyckeln lätt att upptäcka.

**OWASP:** A02:2021 – Cryptographic Failures.

**Bevis:** I `mock-api/server.js` är `const SECRET = 'kraftly'` hårdkodad och används vid signering och verifiering av JWT.

**Fix:** Använd en stark, slumpmässig hemlighet från säker konfiguration och hantera nyckelrotation på ett kontrollerat sätt.

## 5. Otillräcklig kontroll av CORS-origin

**Hål:** API:et speglar inkommande `Origin` utan att kontrollera den mot en tillåten lista.

**OWASP:** A05:2021 – Security Misconfiguration.

**Bevis:** I `mock-api/server.js` sätts `Access-Control-Allow-Origin` till `req.get('Origin') || '*'`, samtidigt som `Access-Control-Allow-Credentials` sätts till `true`.

**Fix:** Tillåt endast betrodda origins genom en explicit allowlist och använd credentials endast där det behövs.

## 6. Osäkra lösenord och avsaknad av hastighetsbegränsning

**Hål:** Lösenorden lagras i klartext i källkoden, och inloggningen saknar synlig hastighetsbegränsning samt ger olika felmeddelanden beroende på om e-postadressen finns.

**OWASP:** A07:2021 – Identification and Authentication Failures.

**Bevis:** I `mock-api/server.js` lagras lösenorden direkt i `users`-listan. `/api/login` svarar med olika felmeddelanden för okänd e-postadress respektive fel lösenord.

**Fix:** Lagra lösenord med Argon2id eller bcrypt, inför hastighetsbegränsning och använd ett enhetligt felmeddelande vid misslyckad inloggning.
_________________________________________________________________________________________________________________
### Regressionstest – IDOR

**Test:** `mock-api/idor.test.js`

**Före fix:** Testet misslyckades eftersom Anna kunde få Bos fakturor genom att ändra `customerNo`.

**Fix:** API:t använder nu `req.user.customerNo` i stället för kundnumret från frågeparametern.

**Efter fix:** Testet passerar och verifierar att Anna får sina fyra fakturor även när begäran innehåller Bos kundnummer.

**Kör testet:** `node --test mock-api/idor.test.js`
___________________________________________________________________________________________________________________