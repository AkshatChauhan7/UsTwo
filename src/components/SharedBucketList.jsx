import React, { useEffect, useMemo, useState } from 'react';
import api from '../api';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';

const moodBackgroundMap = {
  cozy: 'bg-gradient-to-b from-rose-50/80 via-pink-50/60 to-orange-50/70',
  night: 'bg-gradient-to-b from-[#241733] via-[#1f172a] to-[#140f1c]',
  playful: 'bg-gradient-to-b from-fuchsia-50/80 via-purple-50/70 to-sky-50/70',
  deep: 'bg-gradient-to-b from-purple-50/70 via-violet-50/70 to-rose-50/70',
  movie: 'bg-gradient-to-b from-[#241733] via-[#1f172a] to-[#140f1c]'
};

const SharedBucketList = ({ coupleId, mood = 'cozy', partnerName = 'your partner' }) => {
  const { user } = useAuth();
  const socket = useSocket();

  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });

  const isNight = mood === 'night' || mood === 'movie';
  const laneToneClass = useMemo(
    () => moodBackgroundMap[mood] || moodBackgroundMap.cozy,
    [mood]
  );

  useEffect(() => {
    if (!coupleId) return;

    let isMounted = true;

    const loadItems = async () => {
      setIsLoading(true);
      try {
        const response = await api.getBucketListItems();
        if (isMounted) {
          setItems(response.data.items || []);
        }
      } catch (error) {
        console.error('Failed to load bucket list:', error);
        if (isMounted) {
          setItems([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadItems();

    return () => {
      isMounted = false;
    };
  }, [coupleId]);

  useEffect(() => {
    if (!socket || !coupleId) return;

    const onItemUpdated = (updatedItem) => {
      if (!updatedItem?._id) return;
      setItems((prev) => prev.map((item) => (item._id === updatedItem._id ? updatedItem : item)));
    };

    const onItemAdded = (newItem) => {
      if (!newItem?._id) return;
      setItems((prev) => {
        if (prev.some((item) => item._id === newItem._id)) return prev;
        return [newItem, ...prev];
      });
    };

    const onItemDeleted = ({ itemId }) => {
      if (!itemId) return;
      setItems((prev) => prev.filter((item) => item._id !== itemId));
    };

    socket.on('bucket-item-updated', onItemUpdated);
    socket.on('bucket-item-added', onItemAdded);
    socket.on('bucket-item-deleted', onItemDeleted);

    return () => {
      socket.off('bucket-item-updated', onItemUpdated);
      socket.off('bucket-item-added', onItemAdded);
      socket.off('bucket-item-deleted', onItemDeleted);
    };
  }, [socket, coupleId]);

  const handleCreateItem = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) return;

    setIsSubmitting(true);
    try {
      await api.createBucketListItem({
        title: form.title.trim(),
        description: form.description.trim()
      });

      setForm({ title: '', description: '' });
    } catch (error) {
      console.error('Failed to create bucket item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (itemId) => {
    try {
      await api.deleteBucketListItem(itemId);
    } catch (error) {
      console.error('Failed to delete bucket item:', error);
    }
  };

  const handleToggle = (itemId) => {
    if (!socket || !itemId) return;
    socket.emit('toggle-bucket-item', {
      coupleId,
      itemId,
      userId: user?.id
    });
  };

  const getCompletionLabel = (item) => {
    const checksCount = item?.checks?.length || 0;
    const isCheckedByMe = (item?.checks || []).some((id) => id?.toString() === user?.id?.toString());

    if (checksCount === 0) return 'Pending';
    if (checksCount === 1) {
      return isCheckedByMe ? `Waiting for ${partnerName}...` : 'Your turn to approve ✍️';
    }
    return 'Completed together ✨';
  };

  const getItemClasses = (item) => {
    if (item.status === 'completed') {
      return 'bg-linear-to-r from-emerald-100/80 to-teal-100/70 border-emerald-300/70';
    }
    if (item.status === 'half-done') {
      return 'bg-amber-50/80 border-amber-200/70';
    }
    return 'bg-white/70 border-pink-100';
  };

  if (isLoading) {
    return (
      <div className="h-full min-h-0 rounded-2xl ustwo-glass flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mb-3" />
          <p className="text-gray-600">Loading shared bucket list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full min-h-0 rounded-2xl border border-white/40 overflow-y-auto p-4 sm:p-5 ${laneToneClass}`}>
      <div className="ustwo-glass rounded-2xl p-4 sm:p-5 border border-white/60 shadow-sm mb-4">
        <h2 className={`text-xl sm:text-2xl font-black mb-1 ${isNight ? 'text-white' : 'text-gray-800'}`}>
          Shared Bucket List 🎯
        </h2>
        <p className={`text-sm ${isNight ? 'text-purple-100' : 'text-gray-600'}`}>
          Mark dreams together. Both of you must check an item to fully complete it.
        </p>

        <form onSubmit={handleCreateItem} className="mt-4 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3">
          <input
            type="text"
            placeholder="Go stargazing at midnight"
            className="sm:col-span-4 rounded-xl border border-pink-100 bg-white/70 backdrop-blur-md px-3 py-2"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            maxLength={140}
            required
          />
          <input
            type="text"
            placeholder="Optional note..."
            className="sm:col-span-6 rounded-xl border border-pink-100 bg-white/70 backdrop-blur-md px-3 py-2"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            maxLength={320}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="sm:col-span-2 ustwo-brand-gradient text-white rounded-xl px-3 py-2 font-semibold disabled:opacity-60"
          >
            {isSubmitting ? 'Adding...' : 'Add'}
          </button>
        </form>
      </div>

      {items.length === 0 ? (
        <div className="ustwo-glass rounded-2xl p-8 text-center border border-white/60">
          <div className="text-5xl mb-3 animate-float-soft">✨</div>
          <h3 className={`text-xl font-black mb-1 ${isNight ? 'text-white' : 'text-gray-800'}`}>No bucket items yet</h3>
          <p className={`${isNight ? 'text-purple-100' : 'text-gray-600'}`}>
            Add your first shared goal and start checking it off together.
          </p>
        </div>
      ) : (
        <ul className="space-y-3 pb-2">
          {items.map((item) => {
            const isCheckedByMe = (item?.checks || []).some((id) => id?.toString() === user?.id?.toString());

            return (
              <li
                key={item._id}
                className={`rounded-2xl border p-3 sm:p-4 backdrop-blur-md shadow-sm transition ${getItemClasses(item)}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className={`font-bold ${item.status === 'completed' ? 'line-through text-emerald-700' : isNight ? 'text-white' : 'text-gray-800'}`}>
                      {item.title}
                    </h4>
                    {item.description ? (
                      <p className={`text-sm mt-1 ${item.status === 'completed' ? 'line-through text-emerald-700/90' : isNight ? 'text-purple-100' : 'text-gray-600'}`}>
                        {item.description}
                      </p>
                    ) : null}
                    <p className={`text-xs mt-2 font-semibold ${item.status === 'completed' ? 'text-emerald-700' : item.status === 'half-done' ? 'text-amber-700' : 'text-gray-500'}`}>
                      {getCompletionLabel(item)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggle(item._id)}
                      className={`h-9 px-3 rounded-lg text-sm font-semibold border transition ${
                        isCheckedByMe
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'bg-white/80 text-gray-700 border-pink-100 hover:bg-pink-50'
                      }`}
                    >
                      {isCheckedByMe ? '✓ Checked' : 'Check'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item._id)}
                      className="h-9 px-3 rounded-lg text-sm font-semibold border border-rose-200 text-rose-600 bg-white/80 hover:bg-rose-50 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default SharedBucketList;
