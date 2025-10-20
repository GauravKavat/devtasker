"use client";

export default function FeaturesBento() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-[80%] ml-[10%] py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">Why DevTasker?</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Built by developers, for developers
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-6xl">
        {/* Large feature - spans 2 columns */}
        <div className="md:col-span-2 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
          <h3 className="text-2xl font-bold mb-3">Git Integration</h3>
          <p className="text-gray-700 dark:text-gray-300">
            Seamlessly connect your repositories. Automatically sync branches,
            commits, and pull requests with your tasks. Never lose track of what
            code relates to which feature.
          </p>
        </div>

        {/* Regular feature */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-950 dark:to-pink-950 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
          <h3 className="text-2xl font-bold mb-3">Kanban Boards</h3>
          <p className="text-gray-700 dark:text-gray-300">
            Visualize your workflow with intuitive drag-and-drop boards. Keep
            your team aligned and focused.
          </p>
        </div>

        {/* Regular feature */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
          <h3 className="text-2xl font-bold mb-3">Real-time Collaboration</h3>
          <p className="text-gray-700 dark:text-gray-300">
            Work together in real-time. See updates instantly as your team makes
            progress.
          </p>
        </div>

        {/* Tall feature - spans 2 rows */}
        <div className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-950 dark:to-red-950 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow flex flex-col justify-center">
          <h3 className="text-2xl font-bold mb-3">Developer-First Design</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Every feature is designed with developers in mind. Keyboard
            shortcuts, CLI tools, API access, and integrations with your
            favorite tools.
          </p>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Markdown support everywhere</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Code syntax highlighting</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Webhook integrations</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>REST & GraphQL APIs</span>
            </li>
          </ul>
        </div>

        {/* Regular feature */}
        <div className="bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-950 dark:to-amber-950 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
          <h3 className="text-2xl font-bold mb-3">Smart Automation</h3>
          <p className="text-gray-700 dark:text-gray-300">
            Automate repetitive tasks. Set up custom workflows that trigger on
            events.
          </p>
        </div>

        {/* Regular feature */}
        <div className="bg-gradient-to-br from-cyan-50 to-blue-100 dark:from-cyan-950 dark:to-blue-950 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
          <h3 className="text-2xl font-bold mb-3">Analytics & Reports</h3>
          <p className="text-gray-700 dark:text-gray-300">
            Track velocity, burndown, and team performance with beautiful
            charts.
          </p>
        </div>

        {/* Wide feature - spans 2 columns */}
        <div className="md:col-span-2 bg-gradient-to-br from-rose-50 to-pink-100 dark:from-rose-950 dark:to-pink-950 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
          <h3 className="text-2xl font-bold mb-3">Flexible & Customizable</h3>
          <p className="text-gray-700 dark:text-gray-300">
            Adapt DevTasker to your workflow, not the other way around.
            Customize fields, statuses, and workflows to match your team's
            unique process.
          </p>
        </div>
      </div>
    </div>
  );
}
