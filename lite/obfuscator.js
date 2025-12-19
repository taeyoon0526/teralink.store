const fs = require('fs');
const path = require('path');
const obfuscator = require('javascript-obfuscator');

// 난독화할 파일 경로 설정
const inputFilePath = path.join(__dirname, 'script-backup.js');
const outputFilePath = path.join(__dirname, 'script.js');

// 코드 난독화 함수
function obfuscateCode(filePath) {
    const code = fs.readFileSync(filePath, 'utf8'); // 파일 읽기
    const obfuscatedCode = obfuscator.obfuscate(code, {
        compact: true, // 코드 압축
        controlFlowFlattening: true, // 제어 흐름 플래튼화
        controlFlowFlatteningThreshold: 1, // 제어 흐름 플래튼화 적용 확률
        deadCodeInjection: true, // 죽은 코드 삽입
        deadCodeInjectionThreshold: 1, // 죽은 코드 삽입 확률
        stringArray: true, // 문자열을 배열로 변환
        stringArrayEncoding: ['base64'], // Base64로 문자열 인코딩
        stringArrayThreshold: 1, // 모든 문자열을 배열로 변환
        disableConsoleOutput: true, // console.log 등 출력 제거
        renameGlobals: true, // 전역 변수 이름 변경
        identifierNamesGenerator: 'mangled' // 변수 및 함수명을 짧고 의미 없는 이름으로 변경
    }).getObfuscatedCode();

    fs.writeFileSync(outputFilePath, obfuscatedCode); // 난독화된 코드 파일로 저장
    console.log(`Obfuscated code saved to: ${outputFilePath}`);
}

obfuscateCode(inputFilePath);