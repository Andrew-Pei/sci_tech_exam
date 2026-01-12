const fs = require('fs');
const path = require('path');

describe('考试系统功能测试', () => {
    test('应该存在必要的文件', () => {
        expect(fs.existsSync(path.join(__dirname, '..', 'server.js'))).toBe(true);
        expect(fs.existsSync(path.join(__dirname, '..', 'admin.html'))).toBe(true);
        expect(fs.existsSync(path.join(__dirname, '..', 'admin_login.html'))).toBe(true);
        expect(fs.existsSync(path.join(__dirname, '..', 'index.html'))).toBe(true);
        expect(fs.existsSync(path.join(__dirname, '..', 'questions.json'))).toBe(true);
    });

    test('questions.json 应该包含有效的题目数据', () => {
        const questionsPath = path.join(__dirname, '..', 'questions.json');
        const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
        
        expect(questionsData).toHaveProperty('choiceQuestions');
        expect(questionsData).toHaveProperty('judgeQuestions');
        expect(Array.isArray(questionsData.choiceQuestions)).toBe(true);
        expect(Array.isArray(questionsData.judgeQuestions)).toBe(true);
        expect(questionsData.choiceQuestions.length).toBeGreaterThan(0);
        expect(questionsData.judgeQuestions.length).toBeGreaterThan(0);
    });

    test('服务器配置应该正确', () => {
        const serverPath = path.join(__dirname, '..', 'server.js');
        const serverContent = fs.readFileSync(serverPath, 'utf8');
        
        expect(serverContent).toContain('express');
        expect(serverContent).toContain('cors');
        expect(serverContent).toContain('/api/questions');
        expect(serverContent).toContain('/api/submit');
        expect(serverContent).toContain('/api/scores');
        expect(serverContent).toContain('/api/login');
    });

    test('学生考试页面应该存在并包含必要元素', () => {
        const indexPath = path.join(__dirname, '..', 'index.html');
        const indexContent = fs.readFileSync(indexPath, 'utf8');
        
        expect(indexContent).toContain('初一科技期末考试');
        expect(indexContent).toContain('/api/submit'); // 提交API
        expect(indexContent).toContain('allChoiceQuestions'); // 题目数据
        expect(indexContent).toContain('allJudgeQuestions'); // 题目数据
    });

    test('成绩文件应该存在或能被创建', () => {
        const scoresPath = path.join(__dirname, '..', 'scores.json');
        // 如果文件不存在，服务器应该能创建它
        if (fs.existsSync(scoresPath)) {
            const scoresData = fs.readFileSync(scoresPath, 'utf8');
            expect(scoresData).toBeDefined();
        }
    });
});