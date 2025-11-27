import { FC, useState } from 'react';
import { TimerSettings as TimerSettingsType } from '../../types';

interface TimerSettingsProps {
  settings: TimerSettingsType;
  onSave: (settings: TimerSettingsType) => void;
}

export const TimerSettings: FC<TimerSettingsProps> = ({
  settings,
  onSave,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusMinutes, setFocusMinutes] = useState(Math.floor(settings.focusDuration / 60));
  const [breakMinutes, setBreakMinutes] = useState(Math.floor(settings.breakDuration / 60));
  const [longBreakMinutes, setLongBreakMinutes] = useState(Math.floor(settings.longBreakDuration / 60));
  const [setsPerRound, setSetsPerRound] = useState(settings.setsPerRound);

  const handleOpen = () => {
    setFocusMinutes(Math.floor(settings.focusDuration / 60));
    setBreakMinutes(Math.floor(settings.breakDuration / 60));
    setLongBreakMinutes(Math.floor(settings.longBreakDuration / 60));
    setSetsPerRound(settings.setsPerRound);
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      focusDuration: Math.max(1, focusMinutes) * 60,
      breakDuration: Math.max(1, breakMinutes) * 60,
      longBreakDuration: Math.max(1, longBreakMinutes) * 60,
      setsPerRound: Math.max(1, setsPerRound),
    });
    setIsOpen(false);
  };

  const presets = [
    { focus: 25, break: 5, longBreak: 15, sets: 4, label: '標準' },
    { focus: 50, break: 10, longBreak: 30, sets: 2, label: 'ロング' },
    { focus: 15, break: 3, longBreak: 10, sets: 6, label: 'ショート' },
  ];

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        ⚙ 時間設定
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">タイマー設定</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* プリセット */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              プリセット
            </label>
            <div className="flex gap-2 flex-wrap">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setFocusMinutes(preset.focus);
                    setBreakMinutes(preset.break);
                    setLongBreakMinutes(preset.longBreak);
                    setSetsPerRound(preset.sets);
                  }}
                  className={`px-3 py-1 text-sm rounded-lg border ${
                    focusMinutes === preset.focus &&
                    breakMinutes === preset.break &&
                    setsPerRound === preset.sets
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {preset.label} ({preset.focus}/{preset.break}/{preset.longBreak}分 x{preset.sets})
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 集中時間 */}
            <div>
              <label className="block text-sm font-medium text-red-600 mb-1">
                集中時間 (分)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={focusMinutes}
                onChange={(e) => setFocusMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </div>

            {/* 休憩時間 */}
            <div>
              <label className="block text-sm font-medium text-green-600 mb-1">
                休憩時間 (分)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300"
              />
            </div>

            {/* 長め休憩 */}
            <div>
              <label className="block text-sm font-medium text-blue-600 mb-1">
                長め休憩 (分)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={longBreakMinutes}
                onChange={(e) => setLongBreakMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <p className="text-xs text-gray-400 mt-1">最終セット後</p>
            </div>

            {/* セット数 */}
            <div>
              <label className="block text-sm font-medium text-purple-600 mb-1">
                セット数
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={setsPerRound}
                onChange={(e) => setSetsPerRound(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
              <p className="text-xs text-gray-400 mt-1">1ラウンドの回数</p>
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
