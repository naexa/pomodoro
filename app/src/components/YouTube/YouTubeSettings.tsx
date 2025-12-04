import { FC, useState } from 'react';
import { YouTubeSettings as YouTubeSettingsType } from '../../types';

interface YouTubeSettingsProps {
  focusUrls: string[];
  breakUrls: string[];
  onSave: (settings: YouTubeSettingsType) => void;
}

const MAX_URLS = 10;

export const YouTubeSettings: FC<YouTubeSettingsProps> = ({
  focusUrls,
  breakUrls,
  onSave,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formFocusUrls, setFormFocusUrls] = useState<string[]>(
    focusUrls.length > 0 ? focusUrls : ['']
  );
  const [formBreakUrls, setFormBreakUrls] = useState<string[]>(
    breakUrls.length > 0 ? breakUrls : ['']
  );

  const handleOpen = () => {
    setFormFocusUrls(focusUrls.length > 0 ? focusUrls : ['']);
    setFormBreakUrls(breakUrls.length > 0 ? breakUrls : ['']);
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      focusUrls: formFocusUrls.filter((url) => url.trim() !== ''),
      breakUrls: formBreakUrls.filter((url) => url.trim() !== ''),
    });
    setIsOpen(false);
  };

  const updateFocusUrl = (index: number, value: string) => {
    const newUrls = [...formFocusUrls];
    newUrls[index] = value;
    setFormFocusUrls(newUrls);
  };

  const updateBreakUrl = (index: number, value: string) => {
    const newUrls = [...formBreakUrls];
    newUrls[index] = value;
    setFormBreakUrls(newUrls);
  };

  const addFocusUrl = () => {
    if (formFocusUrls.length < MAX_URLS) {
      setFormFocusUrls([...formFocusUrls, '']);
    }
  };

  const addBreakUrl = () => {
    if (formBreakUrls.length < MAX_URLS) {
      setFormBreakUrls([...formBreakUrls, '']);
    }
  };

  const removeFocusUrl = (index: number) => {
    if (formFocusUrls.length > 1) {
      setFormFocusUrls(formFocusUrls.filter((_, i) => i !== index));
    } else {
      setFormFocusUrls(['']);
    }
  };

  const removeBreakUrl = (index: number) => {
    if (formBreakUrls.length > 1) {
      setFormBreakUrls(formBreakUrls.filter((_, i) => i !== index));
    } else {
      setFormBreakUrls(['']);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="text-sm text-blue-500 hover:text-blue-600"
      >
        設定
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">YouTube BGM設定</h3>
        <p className="text-sm text-gray-500 mb-4">
          各モードに最大{MAX_URLS}曲登録できます。タイマー開始時にランダムで再生されます。
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 集中用BGM */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-red-600">
                集中用BGM
              </label>
              {formFocusUrls.length < MAX_URLS && (
                <button
                  type="button"
                  onClick={addFocusUrl}
                  className="text-xs text-blue-500 hover:text-blue-600"
                >
                  + 追加
                </button>
              )}
            </div>
            <div className="space-y-2">
              {formFocusUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => updateFocusUrl(index, e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeFocusUrl(index)}
                    className="px-2 text-gray-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 休憩用BGM */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-green-600">
                休憩用BGM
              </label>
              {formBreakUrls.length < MAX_URLS && (
                <button
                  type="button"
                  onClick={addBreakUrl}
                  className="text-xs text-blue-500 hover:text-blue-600"
                >
                  + 追加
                </button>
              )}
            </div>
            <div className="space-y-2">
              {formBreakUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => updateBreakUrl(index, e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeBreakUrl(index)}
                    className="px-2 text-gray-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
