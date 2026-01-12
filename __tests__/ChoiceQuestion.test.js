const ChoiceQuestion = require('../models/ChoiceQuestion');

describe('ChoiceQuestion 选择题类', () => {
  let choiceQuestion;
  const options = ['A. 选项1', 'B. 选项2', 'C. 选项3', 'D. 选项4'];

  beforeEach(() => {
    choiceQuestion = new ChoiceQuestion(
      'choice_1',
      '测试选择题',
      options,
      'B'
    );
  });

  test('应该正确创建选择题实例', () => {
    expect(choiceQuestion.id).toBe('choice_1');
    expect(choiceQuestion.question).toBe('测试选择题');
    expect(choiceQuestion.type).toBe('choice');
    expect(choiceQuestion.options).toEqual(options);
    expect(choiceQuestion.correctAnswer).toBe('B');
  });

  test('getOptions() 应该返回选项数组', () => {
    const retrievedOptions = choiceQuestion.getOptions();
    expect(retrievedOptions).toEqual(options);
  });

  test('getCorrectAnswer() 应该返回正确答案', () => {
    const correctAnswer = choiceQuestion.getCorrectAnswer();
    expect(correctAnswer).toBe('B');
  });

  test('validateAnswer() 应该正确验证答案（大小写不敏感）', () => {
    // 测试正确答案（大写）
    expect(choiceQuestion.validateAnswer('B')).toBe(true);
    
    // 测试正确答案（小写）
    expect(choiceQuestion.validateAnswer('b')).toBe(true);
    
    // 测试错误答案
    expect(choiceQuestion.validateAnswer('A')).toBe(false);
    expect(choiceQuestion.validateAnswer('C')).toBe(false);
    expect(choiceQuestion.validateAnswer('D')).toBe(false);
    
    // 测试无效答案
    expect(choiceQuestion.validateAnswer('E')).toBe(false);
    expect(choiceQuestion.validateAnswer('')).toBe(false);
  });

  test('getInfo() 应该返回完整的题目信息', () => {
    const info = choiceQuestion.getInfo();
    expect(info).toEqual({
      id: 'choice_1',
      question: '测试选择题',
      type: 'choice',
      options: options,
      correctAnswer: 'B'
    });
  });

  test('fromJSON() 应该从 JSON 数据创建选择题实例', () => {
    const jsonData = {
      question: '从 JSON 创建的问题',
      options: ['A. 选项A', 'B. 选项B', 'C. 选项C'],
      answer: 'A'
    };

    const question = ChoiceQuestion.fromJSON(jsonData, 'json_choice_1');
    
    expect(question.id).toBe('json_choice_1');
    expect(question.question).toBe('从 JSON 创建的问题');
    expect(question.type).toBe('choice');
    expect(question.options).toEqual(['A. 选项A', 'B. 选项B', 'C. 选项C']);
    expect(question.correctAnswer).toBe('A');
  });

  test('应该处理边缘情况', () => {
    // 测试只有一个选项的选择题
    const singleOptionQuestion = new ChoiceQuestion(
      'single_1',
      '单选项问题',
      ['A. 唯一选项'],
      'A'
    );
    expect(singleOptionQuestion.validateAnswer('A')).toBe(true);
    expect(singleOptionQuestion.validateAnswer('B')).toBe(false);

    // 测试空选项数组
    const emptyOptionsQuestion = new ChoiceQuestion(
      'empty_1',
      '空选项问题',
      [],
      ''
    );
    expect(emptyOptionsQuestion.options).toEqual([]);
  });
});