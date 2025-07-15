/**
 * ToDoList Component
 *
 * Displays and manages the user's daily To-Do tasks.
 *
 * Key features:
 * - Shows today's To-Do items with their status (open, done, snoozed, missed)
 * - Allows marking items as done (earning points)
 * - Allows snoozing items (moving to tomorrow, with penalty)
 * - Supports editing and deleting tasks
 * - Maximum 5 tasks per day
 * - Points capped at 40 per day for To-Do tasks
 */

import { useCallback, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ToDo } from '../types/todos';
import { getViennaDate } from '../utils/gardenUtils';

interface ToDoListProps {
  onPointsChange: (points: number, todoTitle?: string) => void;
}

export default function ToDoList({ onPointsChange }: ToDoListProps) {
  const [todos, setTodos] = useState<ToDo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newToDoTitle, setNewToDoTitle] = useState('');
  const [newToDoPoints, setNewToDoPoints] = useState(5);
  const [editingToDo, setEditingToDo] = useState<ToDo | null>(null);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [todaysTotalToDoPoints, setTodaysTotalToDoPoints] = useState(0);
  const today = getViennaDate();

  // Wrap fetchToDos in useCallback to prevent it from changing on every render
  const fetchToDos = useCallback(async () => {
    try {
      const response = await fetch(`/api/todos?date=${today}`);
      if (response.ok) {
        const data = await response.json();
        setTodos(data);
      }
    } catch (error) {
      console.error('Error fetching To-Dos:', error);
    }
  }, [today]);

  // Fetch To-Dos on component mount
  useEffect(() => {
    fetchToDos();
  }, [fetchToDos]);

  // Calculate today's completed To-Do points total
  useEffect(() => {
    const completedPoints = todos
      .filter(todo => todo.date === today && todo.status === 'done')
      .reduce((sum, todo) => sum + todo.points, 0);

    setTodaysTotalToDoPoints(completedPoints);
  }, [todos, today]);

  // Add a new To-Do
  const addToDo = async () => {
    if (!newToDoTitle.trim()) {
      showToast('Please enter a title');
      return;
    }

    const todosForToday = todos.filter(todo => todo.date === today);
    if (todosForToday.length >= 5 && !editingToDo) {
      showToast('Maximum 5 To-Dos per day');
      return;
    }

    try {
      const newToDo: ToDo = {
        id: editingToDo ? editingToDo.id : uuidv4(),
        title: newToDoTitle,
        points: Math.min(Math.max(newToDoPoints, 1), 20), // Clamp between 1-20
        date: today,
        status: editingToDo ? editingToDo.status : 'open',
        createdAt: editingToDo ? editingToDo.createdAt : Date.now()
      };

      const method = editingToDo ? 'PUT' : 'POST';
      const url = editingToDo ? `/api/todos/${editingToDo.id}` : '/api/todos';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newToDo),
      });

      if (response.ok) {
        await fetchToDos();
        resetForm();
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Error adding To-Do:', error);
    }
  };

  // Mark a To-Do as done
  const markAsDone = async (todo: ToDo) => {
    if (todo.status !== 'open') return;

    try {
      console.log('Marking todo as done, ID:', todo.id);

      // Check if adding these points would exceed the 40 point cap
      const potentialNewTotal = todaysTotalToDoPoints + todo.points;
      const pointsToAdd = potentialNewTotal > 40 ? 40 - todaysTotalToDoPoints : todo.points;

      if (pointsToAdd <= 0) {
        showToast('Daily To-Do points cap reached (40 points)');
        // Still mark as done but don't add points
      }

      // Clone the todo to avoid reference issues
      const updatedTodo = {
        id: todo.id,
        title: todo.title,
        points: todo.points,
        date: todo.date,
        status: 'done',
        createdAt: todo.createdAt
      };

      console.log('Sending updated todo:', updatedTodo);

      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTodo),
      });

      const responseData = await response.json();
      console.log('API response:', response.status, responseData);

      if (response.ok) {
        // Update local state immediately for better user experience
        setTodos(prevTodos =>
          prevTodos.map(t => t.id === todo.id ? {...t, status: 'done'} : t)
        );

        if (pointsToAdd > 0) {
          showToast(`+${pointsToAdd} points`);
          onPointsChange(pointsToAdd, todo.title);
        } else {
          showToast('Task completed (point cap reached)');
        }
      } else {
        console.error('Error response:', responseData);
        showToast('Failed to mark task as done: ' + (responseData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error marking To-Do as done:', error);
      showToast('Error marking task as done');
    }
  };

  // Snooze a To-Do to tomorrow
  const snoozeToDo = async (todo: ToDo) => {
    if (todo.status !== 'open') return;

    try {
      console.log('Snoozing todo, ID:', todo.id);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // Clone the todo to avoid reference issues
      const updatedTodo = {
        id: todo.id,
        title: todo.title,
        points: todo.points,
        date: tomorrowStr,
        status: 'snoozed',
        createdAt: todo.createdAt
      };

      console.log('Sending updated todo for snooze:', updatedTodo);

      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTodo),
      });

      const responseData = await response.json();
      console.log('API response for snooze:', response.status, responseData);

      if (response.ok) {
        // Update local state immediately for better user experience
        setTodos(prevTodos =>
          prevTodos.filter(t => t.id !== todo.id)
        );

        showToast('Task snoozed to tomorrow (-5 points)');
        onPointsChange(-5); // Apply snooze penalty
      } else {
        console.error('Snooze error response:', responseData);
        showToast('Failed to snooze task: ' + (responseData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error snoozing To-Do:', error);
      showToast('Error snoozing task');
    }
  };

  // Delete a To-Do
  const deleteToDo = async (id: string) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchToDos();
      }
    } catch (error) {
      console.error('Error deleting To-Do:', error);
    }
  };

  // Open edit modal for a To-Do
  const openEditModal = (todo: ToDo) => {
    setEditingToDo(todo);
    setNewToDoTitle(todo.title);
    setNewToDoPoints(todo.points);
    setIsModalOpen(true);
  };

  // Reset form fields
  const resetForm = () => {
    setNewToDoTitle('');
    setNewToDoPoints(5);
    setEditingToDo(null);
  };

  // Show toast message
  const showToast = (message: string) => {
    setSnackbarMessage(message);
    setShowSnackbar(true);
    setTimeout(() => setShowSnackbar(false), 3000);
  };

  // Get status class for styling
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-500';
      case 'snoozed': return 'bg-yellow-500';
      case 'missed': return 'bg-red-300';
      default: return 'bg-gray-300';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return '✓';
      case 'snoozed': return '→';
      case 'missed': return '✕';
      default: return '○';
    }
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold mr-2 text-gray-800 dark:text-white">Today&#39;s To-Dos</h2>
          {todaysTotalToDoPoints > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({todaysTotalToDoPoints}/40 points)
            </span>
          )}

          {/* Info icon with tooltip */}
          <div className="relative ml-2 group">
            <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 cursor-help">
              <span className="text-xs font-bold">i</span>
            </div>
            <div className="absolute left-0 bottom-full mb-2 w-72 bg-white dark:bg-gray-800 p-3 rounded shadow-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
              <p className="mb-1"><strong>How To-Dos work:</strong></p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>Click the circle</strong> to mark as done and earn points (max 40 per day)</li>
                <li><strong>Click Snooze</strong> to move to tomorrow (-5 points penalty)</li>
                <li><strong>At midnight</strong>, open tasks are marked as missed (-20% point penalty)</li>
                <li>Maximum 5 tasks per day with 1-20 points each</li>
                <li>Snoozed tasks reappear the next day</li>
              </ul>
            </div>
          </div>
        </div>
        {todos.filter(todo => todo.date === today).length < 5 && (
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition"
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
          >
            Add To-Do
          </button>
        )}
      </div>

      <div className="space-y-2">
        {todos
          .filter(todo => todo.date === today)
          .sort((a, b) => {
            // Sort by status (open first, then snoozed, then done, then missed)
            const statusOrder = { open: 0, snoozed: 1, done: 2, missed: 3 };
            return statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
          })
          .map(todo => (
            <div
              key={todo.id}
              className="flex items-center justify-between p-3 border rounded shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700"
            >
              <div className="flex items-center">
                <button
                  className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center text-white ${getStatusClass(todo.status)} ${todo.status === 'open' ? 'cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all' : ''}`}
                  onClick={() => todo.status === 'open' && markAsDone(todo)}
                  disabled={todo.status !== 'open'}
                  title={todo.status === 'open' ? "Click to mark as done" : ""}
                >
                  {getStatusIcon(todo.status)}
                </button>
                <div className={`${todo.status === 'done' ? 'line-through' : ''} dark:text-white`}>
                  <div>{todo.title}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{todo.points} points</div>
                </div>
              </div>
              <div className="flex">
                {todo.status === 'open' && (
                  <button
                    className="text-yellow-500 dark:text-yellow-400 mr-2 px-3 py-1 border border-yellow-500 dark:border-yellow-400 rounded hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
                    onClick={() => snoozeToDo(todo)}
                  >
                    Snooze
                  </button>
                )}
                <button
                  className="text-gray-500 dark:text-gray-400"
                  onClick={() => openEditModal(todo)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}

        {todos.filter(todo => todo.date === today).length === 0 && (
          <div className="text-center p-4 border rounded bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-500 dark:text-gray-400">
            No to-dos for today. Add up to 5 tasks.
          </div>
        )}
      </div>

      {/* Add/Edit To-Do Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-11/12 max-w-md dark:text-white">
            <h3 className="text-lg font-semibold mb-4">
              {editingToDo ? 'Edit To-Do' : 'Add To-Do'}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={newToDoTitle}
                onChange={(e) => setNewToDoTitle(e.target.value)}
                placeholder="Enter task title"
                maxLength={50}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Points (1-20)</label>
              <input
                type="number"
                className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={newToDoPoints}
                onChange={(e) => setNewToDoPoints(Number(e.target.value))}
                min={1}
                max={20}
              />
            </div>
            <div className="flex justify-between">
              <button
                className="bg-gray-300 dark:bg-gray-600 px-4 py-2 rounded dark:text-white hover:bg-gray-400 dark:hover:bg-gray-500 transition"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </button>
              {editingToDo && (
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                  onClick={() => {
                    deleteToDo(editingToDo.id);
                    setIsModalOpen(false);
                  }}
                >
                  Delete
                </button>
              )}
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                onClick={addToDo}
              >
                {editingToDo ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Snackbar for notifications */}
      {showSnackbar && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded">
          {snackbarMessage}
        </div>
      )}
    </div>
  );
}
