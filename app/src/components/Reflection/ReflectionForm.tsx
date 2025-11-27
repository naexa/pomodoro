import { FC, useState } from 'react';

interface ReflectionFormProps {
  onSubmit: (content: string) => void;
  onSkip: () => void;
}

export const ReflectionForm: FC<ReflectionFormProps> = ({ onSubmit, onSkip }) => {
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
        <h2 className="text-xl font-bold mb-2">おはようございます！</h2>
        <p className="text-gray-600 mb-4">
          昨日の振り返りを入力してください。今日のタスクに活かしましょう。
        </p>

        <form onSubmit={handleSubmit}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="昨日はどうでしたか？何がうまくいった？何を改善したい？"
            className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />

          <div className="flex gap-2 justify-end mt-4">
            <button
              type="button"
              onClick={onSkip}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              スキップ
            </button>
            <button
              type="submit"
              disabled={!content.trim()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
