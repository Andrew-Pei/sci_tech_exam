const ChoiceQuestion = require('./ChoiceQuestion');
const JudgeQuestion = require('./JudgeQuestion');
const fs = require('fs');
const path = require('path');

/**
 * 题目管理器类
 * 负责加载、管理和提供题目
 */
class QuestionManager {
    /**
     * 构造函数
     */
    constructor() {
        this.questions = new Map(); // 使用Map存储题目，key为题目ID
        this.choiceQuestions = new Map();
        this.judgeQuestions = new Map();
    }

    /**
     * 从JSON文件加载题目
     * @param {string} filePath - JSON文件路径
     * @returns {Promise<void>}
     */
    async loadFromFile(filePath) {
        try {
            const absolutePath = path.resolve(filePath);
            const data = fs.readFileSync(absolutePath, 'utf8');
            const jsonData = JSON.parse(data);
            
            this.loadFromJSON(jsonData);
            console.log(`成功加载题目：${this.questions.size} 道题目`);
        } catch (error) {
            console.error('加载题目文件失败:', error);
            throw error;
        }
    }

    /**
     * 从JSON对象加载题目
     * @param {object} jsonData - JSON数据
     */
    loadFromJSON(jsonData) {
        // 清空现有题目
        this.questions.clear();
        this.choiceQuestions.clear();
        this.judgeQuestions.clear();

        // 加载选择题
        if (jsonData.choiceQuestions && Array.isArray(jsonData.choiceQuestions)) {
            jsonData.choiceQuestions.forEach((questionData, index) => {
                const id = `choice_${index + 1}`;
                const question = ChoiceQuestion.fromJSON(questionData, id);
                this.questions.set(id, question);
                this.choiceQuestions.set(id, question);
            });
        }

        // 加载判断题
        if (jsonData.judgeQuestions && Array.isArray(jsonData.judgeQuestions)) {
            jsonData.judgeQuestions.forEach((questionData, index) => {
                const id = `judge_${index + 1}`;
                const question = JudgeQuestion.fromJSON(questionData, id);
                this.questions.set(id, question);
                this.judgeQuestions.set(id, question);
            });
        }
    }

    /**
     * 获取所有题目
     * @returns {Array<Question>} 题目数组
     */
    getAllQuestions() {
        return Array.from(this.questions.values());
    }

    /**
     * 获取所有选择题
     * @returns {Array<ChoiceQuestion>} 选择题数组
     */
    getAllChoiceQuestions() {
        return Array.from(this.choiceQuestions.values());
    }

    /**
     * 获取所有判断题
     * @returns {Array<JudgeQuestion>} 判断题数组
     */
    getAllJudgeQuestions() {
        return Array.from(this.judgeQuestions.values());
    }

    /**
     * 根据ID获取题目
     * @param {string} id - 题目ID
     * @returns {Question|null} 题目对象，如果不存在则返回null
     */
    getQuestionById(id) {
        return this.questions.get(id) || null;
    }

    /**
     * 获取题目数量
     * @returns {object} 题目数量统计
     */
    getQuestionCount() {
        return {
            total: this.questions.size,
            choice: this.choiceQuestions.size,
            judge: this.judgeQuestions.size
        };
    }

    /**
     * 验证答案
     * @param {string} questionId - 题目ID
     * @param {any} userAnswer - 用户答案
     * @returns {object} 验证结果
     */
    validateAnswer(questionId, userAnswer) {
        const question = this.getQuestionById(questionId);
        if (!question) {
            return {
                success: false,
                message: '题目不存在'
            };
        }

        const isCorrect = question.validateAnswer(userAnswer);
        return {
            success: true,
            isCorrect: isCorrect,
            correctAnswer: question.getCorrectAnswer(),
            questionInfo: question.getInfo()
        };
    }

    /**
     * 批量验证答案
     * @param {Array<object>} answers - 答案数组，每个元素包含questionId和userAnswer
     * @returns {Array<object>} 验证结果数组
     */
    validateAnswers(answers) {
        return answers.map(answer => {
            const result = this.validateAnswer(answer.questionId, answer.userAnswer);
            return {
                questionId: answer.questionId,
                ...result
            };
        });
    }

    /**
     * 获取随机题目
     * @param {number} count - 题目数量
     * @param {string} type - 题目类型（可选：'choice', 'judge', 'all'）
     * @returns {Array<Question>} 随机题目数组
     */
    getRandomQuestions(count, type = 'all') {
        let questionPool;
        
        switch (type) {
            case 'choice':
                questionPool = this.getAllChoiceQuestions();
                break;
            case 'judge':
                questionPool = this.getAllJudgeQuestions();
                break;
            case 'all':
            default:
                questionPool = this.getAllQuestions();
                break;
        }

        if (count >= questionPool.length) {
            return [...questionPool]; // 返回所有题目的副本
        }

        // 随机选择题目
        const shuffled = [...questionPool].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    /**
     * 导出为JSON格式
     * @returns {object} JSON格式的题目数据
     */
    toJSON() {
        return {
            choiceQuestions: this.getAllChoiceQuestions().map(q => ({
                question: q.question,
                options: q.options,
                answer: q.correctAnswer
            })),
            judgeQuestions: this.getAllJudgeQuestions().map(q => ({
                question: q.question,
                answer: q.correctAnswer
            }))
        };
    }
}

module.exports = QuestionManager;