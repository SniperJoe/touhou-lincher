import { CustomGameCategory } from '@/data-types';

export function findCategoryAndRun(id: number, task: (category: CustomGameCategory, container: CustomGameCategory[], index: string) => void, categories: CustomGameCategory[]) : boolean {
    for (const categoryIndex in categories) {
        if (categories[categoryIndex].id === id) {
            task(categories[categoryIndex], categories, categoryIndex);
            return true;
        }
    }
    for (const categoryIndex in categories) {
        if (findCategoryAndRun(id, task, categories[categoryIndex].children)) {
            return true;
        }
    }
    return false;
}
export function forEachCategory(task: (category: CustomGameCategory) => void, categories: CustomGameCategory[]): void {
    for (const categoryIndex in categories) {
        task(categories[categoryIndex]);
        forEachCategory(task, categories[categoryIndex].children);
    }
}
