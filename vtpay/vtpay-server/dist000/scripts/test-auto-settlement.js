"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const ZainpayService_1 = require("../services/ZainpayService");
const models_1 = require("../models");
/**
 * Test Auto-Settlement Configuration
 * Verifies that global settlement config works and zainboxes get auto-configured
 */
async function testAutoSettlement() {
    console.log('🚀 Testing Auto-Settlement Configuration\n');
    await (0, database_1.connectDatabase)();
    await ZainpayService_1.zainpayService.refreshConfig();
    const results = {
        passed: 0,
        failed: 0,
        tests: []
    };
    const addResult = (name, status, message) => {
        results.tests.push({ name, status, message });
        if (status === 'PASS')
            results.passed++;
        else
            results.failed++;
        console.log(`${status === 'PASS' ? '✅' : '❌'} ${name}: ${message}`);
    };
    // Test 1: Configure Global Settlement Settings
    try {
        console.log('\n📋 Test 1: Configure Global Settlement Settings');
        let systemSettings = await models_1.SystemSetting.findOne();
        if (!systemSettings) {
            systemSettings = new models_1.SystemSetting();
        }
        systemSettings.globalSettlement = {
            status: true,
            weekendSettlementEnabled: true,
            scheduleType: 'T1',
            schedulePeriod: 'Daily',
            settlementAccounts: [
                {
                    accountName: 'Test Settlement Account',
                    accountNumber: '1234567890',
                    bankCode: '058', // GTBank
                    percentage: '100'
                }
            ]
        };
        await systemSettings.save();
        addResult('Configure Global Settlement', 'PASS', 'Global settlement configured successfully');
    }
    catch (error) {
        addResult('Configure Global Settlement', 'FAIL', error.message);
    }
    // Test 2: Verify Global Settlement Config
    try {
        console.log('\n🔍 Test 2: Verify Global Settlement Config');
        const systemSettings = await models_1.SystemSetting.findOne();
        if (systemSettings?.globalSettlement?.status &&
            systemSettings.globalSettlement.settlementAccounts?.length > 0) {
            addResult('Verify Global Config', 'PASS', `Config found with ${systemSettings.globalSettlement.settlementAccounts.length} accounts`);
        }
        else {
            addResult('Verify Global Config', 'FAIL', 'Global settlement not properly configured');
        }
    }
    catch (error) {
        addResult('Verify Global Config', 'FAIL', error.message);
    }
    // Test 3: Get Zainboxes
    let testZainboxes = [];
    try {
        console.log('\n📦 Test 3: Get Zainboxes');
        const zainboxes = await models_1.Zainbox.find({}).limit(3);
        testZainboxes = zainboxes;
        if (zainboxes.length > 0) {
            addResult('Get Zainboxes', 'PASS', `Found ${zainboxes.length} zainboxes for testing`);
        }
        else {
            addResult('Get Zainboxes', 'FAIL', 'No zainboxes found');
        }
    }
    catch (error) {
        addResult('Get Zainboxes', 'FAIL', error.message);
    }
    // Test 4: Auto-Configure Settlement for Zainboxes
    if (testZainboxes.length > 0) {
        try {
            console.log('\n💰 Test 4: Auto-Configure Settlement for Zainboxes');
            const systemSettings = await models_1.SystemSetting.findOne();
            let configuredCount = 0;
            let skippedCount = 0;
            for (const zBox of testZainboxes) {
                try {
                    // Check if settlement already exists
                    const existingSettlement = await ZainpayService_1.zainpayService.getSettlement(zBox.zainboxCode);
                    if (existingSettlement?.data) {
                        console.log(`   Settlement already configured for ${zBox.zainboxCode}, skipping...`);
                        skippedCount++;
                        continue;
                    }
                }
                catch (error) {
                    // If 404 or not found, settlement doesn't exist
                    if (!error.message.includes('404') && !error.message.includes('not found') && !error.message.includes('406')) {
                        console.error(`   Error checking settlement for ${zBox.zainboxCode}:`, error.message);
                        continue;
                    }
                }
                // Create settlement
                const settlementPayload = {
                    name: `auto-test-settlement-${zBox.zainboxCode}`,
                    zainboxCode: zBox.zainboxCode,
                    scheduleType: systemSettings.globalSettlement.scheduleType,
                    schedulePeriod: systemSettings.globalSettlement.schedulePeriod,
                    settlementAccountList: systemSettings.globalSettlement.settlementAccounts,
                    status: true
                };
                await ZainpayService_1.zainpayService.createSettlement(settlementPayload);
                configuredCount++;
                console.log(`   ✅ Settlement configured for ${zBox.zainboxCode}`);
            }
            addResult('Auto-Configure Settlements', 'PASS', `Configured: ${configuredCount}, Skipped: ${skippedCount}`);
        }
        catch (error) {
            addResult('Auto-Configure Settlements', 'FAIL', error.message);
        }
    }
    // Test 5: Verify Settlements Were Created
    if (testZainboxes.length > 0) {
        try {
            console.log('\n🔍 Test 5: Verify Settlements Were Created');
            let verifiedCount = 0;
            for (const zBox of testZainboxes) {
                try {
                    const settlement = await ZainpayService_1.zainpayService.getSettlement(zBox.zainboxCode);
                    if (settlement?.data) {
                        verifiedCount++;
                        console.log(`   ✅ Settlement verified for ${zBox.zainboxCode}: ${settlement.data.scheduleType}`);
                    }
                }
                catch (error) {
                    console.log(`   ⚠️  No settlement found for ${zBox.zainboxCode}`);
                }
            }
            if (verifiedCount > 0) {
                addResult('Verify Settlements', 'PASS', `${verifiedCount}/${testZainboxes.length} settlements verified`);
            }
            else {
                addResult('Verify Settlements', 'FAIL', 'No settlements found');
            }
        }
        catch (error) {
            addResult('Verify Settlements', 'FAIL', error.message);
        }
    }
    // Print Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📊 Total:  ${results.tests.length}`);
    console.log(`🎯 Success Rate: ${((results.passed / results.tests.length) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));
    if (results.failed > 0) {
        console.log('\n❌ Failed Tests:');
        results.tests.filter(t => t.status === 'FAIL').forEach(t => {
            console.log(`   - ${t.name}: ${t.message}`);
        });
    }
    console.log('\n✨ Auto-settlement test suite completed!\n');
    process.exit(results.failed > 0 ? 1 : 0);
}
testAutoSettlement().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
});
//# sourceMappingURL=test-auto-settlement.js.map