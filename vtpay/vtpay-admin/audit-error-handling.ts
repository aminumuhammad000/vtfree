/**
 * Error Handling Audit Script
 * Checks all API calls in the admin panel for proper error handling
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface ErrorHandlingIssue {
    file: string;
    line: number;
    issue: string;
    severity: 'high' | 'medium' | 'low';
}

async function auditErrorHandling() {
    const issues: ErrorHandlingIssue[] = [];

    // Find all TypeScript/TSX files in pages directory
    const files = await glob('src/pages/**/*.{ts,tsx}', {
        cwd: '/home/mrcoder/Documents/ProjectStation/vtfree/vtpay/vtpay-admin',
        absolute: true
    });

    console.log('🔍 Auditing Error Handling in Admin Panel\n');
    console.log('='.repeat(80));
    console.log(`\nScanning ${files.length} files...\n`);

    for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
            const lineNum = index + 1;

            // Check for API calls without try-catch
            if (line.includes('await adminApi.') && !line.includes('try')) {
                // Look back to see if we're in a try block
                let inTryBlock = false;
                for (let i = index; i >= Math.max(0, index - 20); i--) {
                    if (lines[i].includes('try {')) {
                        inTryBlock = true;
                        break;
                    }
                }

                if (!inTryBlock) {
                    issues.push({
                        file: path.basename(file),
                        line: lineNum,
                        issue: 'API call without try-catch block',
                        severity: 'high'
                    });
                }
            }

            // Check for catch blocks without toast notifications
            if (line.includes('} catch')) {
                let hasToast = false;
                for (let i = index; i < Math.min(lines.length, index + 10); i++) {
                    if (lines[i].includes('toast.error') || lines[i].includes('toast.warning')) {
                        hasToast = true;
                        break;
                    }
                }

                if (!hasToast) {
                    issues.push({
                        file: path.basename(file),
                        line: lineNum,
                        issue: 'Catch block without user notification',
                        severity: 'medium'
                    });
                }
            }
        });
    }

    // Display results
    console.log('📊 AUDIT RESULTS:\n');

    const highIssues = issues.filter(i => i.severity === 'high');
    const mediumIssues = issues.filter(i => i.severity === 'medium');
    const lowIssues = issues.filter(i => i.severity === 'low');

    console.log(`  🔴 High Priority: ${highIssues.length}`);
    console.log(`  🟡 Medium Priority: ${mediumIssues.length}`);
    console.log(`  🟢 Low Priority: ${lowIssues.length}`);
    console.log(`  📝 Total Issues: ${issues.length}\n`);

    if (issues.length > 0) {
        console.log('='.repeat(80));
        console.log('\n🔴 HIGH PRIORITY ISSUES:\n');
        highIssues.slice(0, 10).forEach(issue => {
            console.log(`  ${issue.file}:${issue.line}`);
            console.log(`    → ${issue.issue}\n`);
        });

        if (highIssues.length > 10) {
            console.log(`  ... and ${highIssues.length - 10} more high priority issues\n`);
        }
    }

    console.log('='.repeat(80));
    console.log('\n✅ AUDIT COMPLETE!\n');
    console.log('📝 RECOMMENDATIONS:\n');
    console.log('  1. All API calls should be wrapped in try-catch blocks');
    console.log('  2. All catch blocks should show toast notifications to users');
    console.log('  3. Errors should be logged to console for debugging');
    console.log('  4. Consider implementing retry logic for failed requests\n');
}

auditErrorHandling().catch(console.error);
