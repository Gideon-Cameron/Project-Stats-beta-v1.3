import React, { useEffect, useState } from 'react';
import StrengthInput, { StrengthFormData } from '../../components/statInputs/StrengthInput';
import { calculateStrengthRank } from '../../utils/calculateStrengthRank';
import { calculateAverageStrengthRank } from '../../utils/calculateAverageStrength';
import { StrengthTest, strengthRankThresholds } from '../../data/strengthRankThresholds';
import { Rank } from '../../types/Rank';
import RadarChart from '../../components/RadarChart';
import { useAuth } from '../../context/AuthContext';
import { saveUserStats } from '../../utils/saveUserStats';
import { loadUserStats } from '../../utils/loadUserStats';
import { loadUserHistory } from '../../utils/loadUserHistory';
import SubRankDisplay from '../../components/SubRankDisplay';

const STRENGTH_TESTS: StrengthTest[] = [
  'benchPress',
  'squat',
  'deadlift',
  'overheadPress',
  'pullUps',
  'pushUps',
  'barHang',
  'plankHold',
];

const StrengthStatPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<StrengthFormData | null>(null);
  const [result, setResult] = useState<Record<StrengthTest, Rank> | null>(null);
  const [average, setAverage] = useState<{ averageScore: number; globalRank: Rank } | null>(null);
  const [loading, setLoading] = useState(true);

  const [history, setHistory] = useState<
    (StrengthFormData & { averageScore: number; globalRank: Rank; timestamp: number; id: string })[]
  >([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);

  const [latestData, setLatestData] = useState<{
    formData: StrengthFormData;
    result: Record<StrengthTest, Rank>;
    average: { averageScore: number; globalRank: Rank };
  } | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const saved = await loadUserStats<StrengthFormData & { averageScore: number; globalRank: Rank }>(
        user,
        'strength'
      );
      const allHistory = await loadUserHistory<StrengthFormData & {
        averageScore: number;
        globalRank: Rank;
        id: string;
        timestamp: number;
      }>(user, 'strength');

      setHistory(allHistory);
      setHistoryIndex(null);

      if (saved) {
        const { averageScore, globalRank, ...inputs } = saved;

        const ranks = STRENGTH_TESTS.reduce((acc, key) => {
          acc[key] = calculateStrengthRank(key, Number(inputs[key]));
          return acc;
        }, {} as Record<StrengthTest, Rank>);

        setFormData(inputs);
        setResult(ranks);
        setAverage({ averageScore, globalRank });
        setLatestData({ formData: inputs, result: ranks, average: { averageScore, globalRank } });
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const handleSubmit = async (data: StrengthFormData) => {
    const ranks = STRENGTH_TESTS.reduce((acc, key) => {
      acc[key] = calculateStrengthRank(key, Number(data[key]));
      return acc;
    }, {} as Record<StrengthTest, Rank>);

    const averageResult = calculateAverageStrengthRank(Object.values(ranks));

    setFormData(data);
    setResult(ranks);
    setAverage(averageResult);
    setLatestData({ formData: data, result: ranks, average: averageResult });
    setHistoryIndex(null);

    if (user) {
      await saveUserStats(user, 'strength', {
        ...data,
        averageScore: averageResult.averageScore,
        globalRank: averageResult.globalRank,
      });

      const updatedHistory = await loadUserHistory<StrengthFormData & {
        averageScore: number;
        globalRank: Rank;
        id: string;
        timestamp: number;
      }>(user, 'strength');

      setHistory(updatedHistory);
    }
  };

  const updateFromSnapshot = (index: number) => {
    const snapshot = history[index];
    if (!snapshot) return;

    const { averageScore, globalRank, ...inputs } = snapshot;

    const ranks = STRENGTH_TESTS.reduce((acc, key) => {
      acc[key] = calculateStrengthRank(key, Number(inputs[key]));
      return acc;
    }, {} as Record<StrengthTest, Rank>);

    setFormData(inputs);
    setResult(ranks);
    setAverage({ averageScore, globalRank });
    setHistoryIndex(index);
  };

  const goToPreviousSnapshot = () => {
    if (historyIndex === null && history.length > 0) {
      updateFromSnapshot(history.length - 1);
    } else if (historyIndex !== null && historyIndex > 0) {
      updateFromSnapshot(historyIndex - 1);
    }
  };

  const goToNextSnapshot = () => {
    if (historyIndex !== null) {
      if (historyIndex < history.length - 1) {
        updateFromSnapshot(historyIndex + 1);
      } else {
        if (latestData) {
          setFormData(latestData.formData);
          setResult(latestData.result);
          setAverage(latestData.average);
        }
        setHistoryIndex(null);
      }
    }
  };

  if (loading) return <p className="text-center mt-10">Loading saved data...</p>;

  return (
    <div className="py-10 px-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Strength Stat Assessment</h1>
      <StrengthInput onSubmit={handleSubmit} initialData={formData ?? undefined} />

      {result && (
        <div className="mt-10 bg-gray-100 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Your Strength Ranks</h2>

          {history.length > 0 && (
            <div className="flex justify-center items-center gap-4 mb-4">
              <button
                onClick={goToPreviousSnapshot}
                disabled={history.length === 0 || (historyIndex !== null && historyIndex === 0)}
                className="bg-gray-300 px-3 py-1 rounded disabled:opacity-50"
              >
                ← Previous
              </button>
              <span className="text-sm text-gray-600">
                {historyIndex === null
                  ? 'Viewing: Current Stats'
                  : `Viewing: Snapshot ${historyIndex + 1} of ${history.length}`}
              </span>
              <button
                onClick={goToNextSnapshot}
                disabled={history.length === 0}
                className="bg-gray-300 px-3 py-1 rounded disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          )}

          <RadarChart data={result} />

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mt-6">
            {Object.entries(result).map(([test]) => {
              const value = formData?.[test as keyof StrengthFormData];

              return (
                <li key={test} className="flex justify-between items-center border-b py-2">
                  <span className="capitalize whitespace-nowrap">{test.replace(/([A-Z])/g, ' $1')}</span>
                  {value !== undefined ? (
                    <SubRankDisplay
                      value={Number(value)}
                      thresholds={strengthRankThresholds[test as StrengthTest]}
                    />
                  ) : (
                    <span className="text-gray-400">No data</span>
                  )}
                </li>
              );
            })}
          </ul>

          {average && (
            <div className="mt-6 text-center">
              <p className="text-lg">
                <span className="font-semibold">Average Strength Score:</span> {average.averageScore}
              </p>
              <p className="text-xl mt-1">
                <span className="font-bold text-blue-800">Global Rank:</span> {average.globalRank}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StrengthStatPage;
