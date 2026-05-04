$path = 'g:\Exam-correction-front-main3\Exam-correction-front-main\src\pages\ExamTemplateSetup.tsx'
$content = Get-Content $path -Encoding UTF8
$newContent = $content[0..1536] + $content[1587..($content.Length-1)]
$newContent | Set-Content $path -Encoding UTF8
