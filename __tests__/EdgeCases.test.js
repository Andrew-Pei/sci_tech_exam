const QuestionManager = require('../models/QuestionManager');
const ChoiceQuestion = require('../models/ChoiceQuestion');
const JudgeQuestion = require('../models/JudgeQuestion');

describe('边界条件和错误处理测试', () => {
  let questionManager;

  beforeEach(() => {
    questionManager = new QuestionManager();
  });

  describe('空数据测试', () => {
    test('应该处理空的 JSON 数据', () => {
      const emptyData = {};
      questionManager.loadFromJSON(emptyData);
      
      const count = questionManager.getQuestionCount();
      expect(count.total).toBe(0);
      expect(count.choice).toBe(0);
      expect(count.judge).toBe(0);
    });

    test('应该处理空的题目数组', () => {
      const dataWithEmptyArrays = {
        choiceQuestions: [],
        judgeQuestions: []
      };
      questionManager.loadFromJSON(dataWithEmptyArrays);
      
      const count = questionManager.getQuestionCount();
      expect(count.total).toBe(0);
    });

    test('应该处理缺失的题目数组', () => {
      const dataMissingArrays = {
        // 没有 choiceQuestions 和 judgeQuestions
      };
      questionManager.loadFromJSON(dataMissingArrays);
      
      const count = questionManager.getQuestionCount();
      expect(count.total).toBe(0);
    });
  });

  describe('无效数据测试', () => {
    test('应该处理无效的选择题数据', () => {
      const invalidData = {
        choiceQuestions: [
          {
            // 缺少 question 字段
            options: ['A. 选项1'],
            answer: 'A'
          },
          {
            question: '有效问题',
            // 缺少 options 字段
            answer: 'B'
          },
          {
            question: '另一个有效问题',
            options: ['A. 选项1'],
            // 缺少 answer 字段
          }
        ]
      };

      // 应该不会抛出错误，但可能不会创建完整的题目
      expect(() => {
        questionManager.loadFromJSON(invalidData);
      }).not.toThrow();
    });

    test('应该处理无效的判断题数据', () => {
      const invalidData = {
        judgeQuestions: [
          {
            // 缺少 question 字段
            answer: true
          },
          {
            question: '有效问题'
            // 缺少 answer 字段
          }
        ]
      };

      expect(() => {
        questionManager.loadFromJSON(invalidData);
      }).not.toThrow();
    });
  });

  describe('极端值测试', () => {
    test('应该处理大量题目', () => {
      const largeData = {
        choiceQuestions: Array.from({ length: 1000 }, (_, i) => ({
          question: `选择题 ${i + 1}`,
          options: ['A. 选项A', 'B. 选项B', 'C. 选项C'],
          answer: 'A'
        })),
        judgeQuestions: Array.from({ length: 500 }, (_, i) => ({
          question: `判断题 ${i + 1}`,
          answer: i % 2 === 0
        }))
      };

      questionManager.loadFromJSON(largeData);
      
      const count = questionManager.getQuestionCount();
      expect(count.total).toBe(1500);
      expect(count.choice).toBe(1000);
      expect(count.judge).toBe(500);
    });

    test('应该处理超长的问题文本', () => {
      const longQuestion = 'A'.repeat(1000); // 1000个字符的问题
      const data = {
        choiceQuestions: [{
          question: longQuestion,
          options: ['A. 选项1', 'B. 选项2'],
          answer: 'A'
        }]
      };

      questionManager.loadFromJSON(data);
      
      const question = questionManager.getQuestionById('choice_1');
      expect(question.question).toBe(longQuestion);
      expect(question.question.length).toBe(1000);
    });

    test('应该处理大量选项', () => {
      const manyOptions = Array.from({ length: 26 }, (_, i) => 
        `${String.fromCharCode(65 + i)}. 选项${String.fromCharCode(65 + i)}`
      );
      
      const data = {
        choiceQuestions: [{
          question: '多选项问题',
          options: manyOptions,
          answer: 'Z'
        }]
      };

      questionManager.loadFromJSON(data);
      
      const question = questionManager.getQuestionById('choice_1');
      expect(question.options).toHaveLength(26);
      expect(question.options[25]).toBe('Z. 选项Z');
    });
  });

  describe('随机题目测试', () => {
    beforeEach(() => {
      const testData = {
        choiceQuestions: Array.from({ length: 10 }, (_, i) => ({
          question: `选择题 ${i + 1}`,
          options: ['A. 选项A', 'B. 选项B'],
          answer: 'A'
        })),
        judgeQuestions: Array.from({ length: 5 }, (_, i) => ({
          question: `判断题 ${i + 1}`,
          answer: true
        }))
      };
      questionManager.loadFromJSON(testData);
    });

    test('应该处理请求0个随机题目', () => {
      const questions = questionManager.getRandomQuestions(0);
      expect(questions).toHaveLength(0);
    });

    test('应该处理请求负数个随机题目', () => {
      const questions = questionManager.getRandomQuestions(-1);
      expect(questions).toHaveLength(0);
    });

    test('应该处理无效的题目类型', () => {
      const questions = questionManager.getRandomQuestions(3, 'invalid_type');
      // 默认应该返回所有类型的题目
      expect(questions).toHaveLength(3);
    });
  });

  describe('答案验证边界测试', () => {
    test('应该处理各种类型的用户答案', () => {
      const data = {
        choiceQuestions: [{
          question: '测试问题',
          options: ['A. 选项A', 'B. 选项B'],
          answer: 'A'
        }],
        judgeQuestions: [{
          question: '测试判断题',
          answer: true
        }]
      };
      questionManager.loadFromJSON(data);

      // 测试选择题的各种答案类型
      const choiceResult1 = questionManager.validateAnswer('choice_1', 123);
      expect(choiceResult1.isCorrect).toBe(false);

      const choiceResult2 = questionManager.validateAnswer('choice_1', null);
      expect(choiceResult2.isCorrect).toBe(false);

      const choiceResult3 = questionManager.validateAnswer('choice_1', undefined);
      expect(choiceResult3.isCorrect).toBe(false);

      const choiceResult4 = questionManager.validateAnswer('choice_1', {});
      expect(choiceResult4.isCorrect).toBe(false);

      // 测试判断题的各种答案类型
      const judgeResult1 = questionManager.validateAnswer('judge_1', 1);
      expect(judgeResult1.isCorrect).toBe(false);

      const judgeResult2 = questionManager.validateAnswer('judge_1', 'true');
      expect(judgeResult2.isCorrect).toBe(false);

      const judgeResult3 = questionManager.validateAnswer('judge_1', 0);
      expect(judgeResult3.isCorrect).toBe(false);
    });
  });

  describe('ID 处理测试', () => {
    test('应该处理重复加载时的 ID 生成', () => {
      const data1 = {
        choiceQuestions: [{
          question: '问题1',
          options: ['A. 选项A'],
          answer: 'A'
        }]
      };

      const data2 = {
        choiceQuestions: [{
          question: '问题2',
          options: ['A. 选项A'],
          answer: 'A'
        }]
      };

      // 第一次加载
      questionManager.loadFromJSON(data1);
      const question1 = questionManager.getQuestionById('choice_1');
      expect(question1.question).toBe('问题1');

      // 第二次加载（应该清空之前的题目）
      questionManager.loadFromJSON(data2);
      const question2 = questionManager.getQuestionById('choice_1');
      expect(question2.question).toBe('问题2');
    });
  });
});