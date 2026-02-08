import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

/**
 * Transparency Service (The Auditor)
 * Logs all AI decisions for regulatory compliance and generates reports.
 */

const LOG_COLLECTION = 'transparency_logs';

/**
 * Logs an automated decision.
 * 
 * @param {Object} logData
 * @param {string} logData.entityType - 'PRICING' | 'RANKING' | 'OPTIMIZATION'
 * @param {string} logData.resourceId - ID of the item affected
 * @param {string} logData.resourceType - 'hotel' | 'tour'
 * @param {Object} logData.decisionFactors - Key-value pair of inputs (e.g. { occupancy: 80, demand: 50 })
 * @param {string} logData.finalDecision - Simple string summary (e.g. "Increased Price by 5%")
 * @param {Object} logData.weightsUsed - The specific weights/config active at decision time
 * @param {string} logData.reason - Human-readable explanation
 * @param {boolean} logData.isAutomated - true if fully AI, false if human override
 */
export const logDecision = async (logData) => {
    try {
        await addDoc(collection(db, LOG_COLLECTION), {
            ...logData,
            timestamp: serverTimestamp(),
            complianceVersion: 'v1.0' // Version of the Algorithm Logic
        });
        console.log(`[Auditor] Logged ${logData.entityType} decision for ${logData.resourceId}`);
    } catch (e) {
        console.error("[Auditor] Failed to secure log:", e);
        // In a real banking system, this might trigger a circuit breaker.
    }
};

/**
 * Generates a Transparency Report for a specific entity or time range.
 * (Simulated Regulator Report)
 * 
 * @param {string} entityType - Optional filter
 * @returns {Promise<Object>} The report data structure
 */
export const generateTransparencyReport = async (entityType) => {
    const report = {
        generatedAt: new Date().toISOString(),
        statement: "Infinite Yatra operates within predefined algorithmic boundaries. No automated decision reduces visibility below minimum thresholds without cause.",
        summary: {
            totalDecisions: 0,
            automated: 0,
            manualOverride: 0
        },
        decisions: []
    };

    try {
        let q = collection(db, LOG_COLLECTION);
        if (entityType) {
            q = query(q, where('entityType', '==', entityType), orderBy('timestamp', 'desc'), limit(100));
        } else {
            q = query(q, orderBy('timestamp', 'desc'), limit(100));
        }

        const snapshot = await getDocs(q);
        report.summary.totalDecisions = snapshot.size; // Only counting fetched limit for demo

        snapshot.forEach(doc => {
            const data = doc.data();
            report.decisions.push({
                id: doc.id,
                type: data.entityType,
                reason: data.reason,
                factors: data.decisionFactors,
                outcome: data.finalDecision,
                time: data.timestamp?.toDate().toISOString()
            });
            if (data.isAutomated) report.summary.automated++;
            else report.summary.manualOverride++;
        });

    } catch (e) {
        console.error("[Auditor] Report Generation Failed", e);
        report.error = "Could not fetch logs.";
    }

    return report;
};
