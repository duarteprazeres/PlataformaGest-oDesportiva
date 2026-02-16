#!/bin/bash
echo "🚀 Starting Full System Verification..."

# 1. Verify Authentication
echo ""
echo "🔹 [1/2] Verifying Authentication..."
if bash verify_auth.sh; then
    echo "✅ Auth Verification Passed"
else
    echo "❌ Auth Verification FAILED"
    exit 1
fi

# 2. Verify Match Finalization
echo ""
echo "🔹 [2/2] Verifying Match Workflow..."
if bash verify_finalize.sh; then
    echo "✅ Match Verification Passed"
else
    echo "❌ Match Verification FAILED"
    exit 1
fi

echo ""
echo "🎉 All Systems Nominal. Ready to proceed."
