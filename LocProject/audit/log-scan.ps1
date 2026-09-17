$p = 'C:\Project\LocHerbal\LocProject\runtime-fix.log'
$lines = Get-Content $p -Encoding UTF8
Write-Output ("total lines: " + @($lines).Count)

Write-Output "--- P2028 / retry warnings ---"
$retry = $lines | Select-String 'P2028'
Write-Output ("P2028 lines: " + @($retry).Count)
$retry | Select-Object -First 5 | ForEach-Object { $_.Line.Substring(0, [Math]::Min(220, $_.Line.Length)) }

Write-Output "--- NotFound compensating-cancel theo phut ---"
$lines | Select-String 'compensating cancelOrder' | ForEach-Object {
  if ($_.Line -match '"time":"([^"]+)') { $matches[1].Substring(11, 5) }
} | Group-Object | ForEach-Object { $_.Name + " x" + $_.Count }

Write-Output "--- Handling order.created theo phut ---"
$lines | Select-String 'Handling order.created' | ForEach-Object {
  if ($_.Line -match '"time":"([^"]+)') { $matches[1].Substring(11, 5) }
} | Group-Object | ForEach-Object { $_.Name + " x" + $_.Count }

Write-Output "--- Handling order.cancelled theo phut ---"
$lines | Select-String 'Handling order.cancelled' | ForEach-Object {
  if ($_.Line -match '"time":"([^"]+)') { $matches[1].Substring(11, 5) }
} | Group-Object | ForEach-Object { $_.Name + " x" + $_.Count }

Write-Output "--- 500 / Internal server error theo phut ---"
$lines | Select-String '500|Internal' | ForEach-Object {
  if ($_.Line -match '"time":"([^"]+)') { $matches[1].Substring(11, 5) }
} | Group-Object | ForEach-Object { $_.Name + " x" + $_.Count }
