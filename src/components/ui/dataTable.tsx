'use client'
import React from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'

type Column<T> = {
    id: (keyof T & string) | string
    label: string
    className?: string
}

type Props<T> = {
    title?: string
    columns: Column<T>[]
    rows: T[]
    renderCell: (row: T, columnId: (keyof T & string) | string) => React.ReactNode
    loading?: boolean
    error?: string | null
    searchValue?: string
    onSearchChange?: (v: string) => void
    hideSearch?: boolean
    hideHeader?: boolean
    page: number
    totalPages: number
    onPageChange: (p: number) => void
}


function DataTable<T extends object>({
    title,
    columns,
    rows,
    renderCell,
    loading,
    error,
    searchValue,
    onSearchChange,
    hideSearch,
    hideHeader,
    page,
    totalPages,
    onPageChange,
}: Props<T>) {
    return (
        <div className="bg-white">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                {!hideHeader && (
                    <div className="mb-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                                {title || ''}
                            </h1>

                            {!hideSearch && (
                                <div className="relative bg-white rounded-xl w-full sm:w-64 lg:w-80">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchValue || ''}
                                        onChange={(e) => onSearchChange?.(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Desktop Table */}
                <div className="hidden lg:block bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                            <thead className="border-b border-gray-200">
                                <tr>
                                    {columns.map((c) => (
                                        <th
                                            key={c.id}
                                            className={`px-6 py-4 text-left text-xs md:text-sm font-semibold text-gray-700 tracking-wider ${c.className || ''}`}
                                        >
                                            {c.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200">
                                {error && !loading && (
                                    <tr>
                                        <td colSpan={columns.length} className="px-6 py-6 text-sm text-red-600 text-center">
                                            {error}
                                        </td>
                                    </tr>
                                )}

                                {!loading && !error && rows.length === 0 && (
                                    <tr>
                                        <td colSpan={columns.length} className="px-6 py-6 text-sm text-gray-600 text-center">
                                            No data
                                        </td>
                                    </tr>
                                )}

                                {!loading && !error &&
                                    rows.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            {columns.map((c) => (
                                                <td key={c.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {renderCell(row, c.id)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
                </div>

                {/* Mobile View */}
                <div className="lg:hidden bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="divide-y divide-gray-200">
                        {error && !loading && (
                            <div className="p-6 text-sm text-red-600 text-center">{error}</div>
                        )}

                        {!loading && !error && rows.length === 0 && (
                            <div className="p-6 text-sm text-gray-600 text-center">No data</div>
                        )}

                        {!loading && !error &&
                            rows.map((row, idx) => (
                                <div key={idx} className="p-4 hover:bg-gray-50 transition-colors">
                                    {columns.map((c) => (
                                        <div key={c.id} className="grid grid-cols-3 gap-2 py-1">
                                            <div className="text-xs font-semibold text-gray-500">{c.label}</div>
                                            <div className="col-span-2 text-sm text-gray-900">{renderCell(row, c.id)}</div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                    </div>

                    <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
                </div>
            </div>
        </div>
    )
}

export default DataTable

/* Pagination */
type PaginationProps = {
    page: number
    totalPages: number
    onPageChange: (page: number) => void
}

function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
    return (
        <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
                <button
                    disabled={page <= 1}
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
                >
                    <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                <div className="flex gap-2">
                    {[...Array(Math.max(1, Math.min(5, totalPages)))]
                        .map((_, i) => {
                            const p = i + 1
                            const active = page === p
                            return (
                                <button
                                    key={p}
                                    onClick={() => onPageChange(p)}
                                    className={`w-10 h-10 rounded-md font-medium text-sm 
                    ${active ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    {p}
                                </button>
                            )
                        })}
                </div>

                <button
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
                >
                    Next <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
