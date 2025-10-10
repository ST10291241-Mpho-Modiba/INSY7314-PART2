#!/bin/bash

# Comprehensive Compliance Scanner for Banking Application
# Runs all compliance scans (PCI-DSS, SOX, GDPR, AML) and generates consolidated report

set -euo pipefail

echo "🏦 Starting Comprehensive Compliance Scan for Banking Application..."
echo "=================================================================="

# Configuration
NAMESPACE="banking-app"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
REPORTS_DIR="compliance-reports-$TIMESTAMP"
CONSOLIDATED_REPORT="consolidated-compliance-report-$TIMESTAMP.json"

# Create reports directory
mkdir -p "$REPORTS_DIR"

# Function to check if kubectl is available and cluster is accessible
check_kubernetes() {
    if ! command -v kubectl &> /dev/null; then
        echo "⚠️ kubectl not found. Some checks will be skipped."
        return 1
    fi
    
    if ! kubectl cluster-info &> /dev/null; then
        echo "⚠️ Kubernetes cluster not accessible. Some checks will be skipped."
        return 1
    fi
    
    return 0
}

# Function to check if namespace exists
check_namespace() {
    if kubectl get namespace "$NAMESPACE" &> /dev/null; then
        echo "✅ Namespace '$NAMESPACE' found"
        return 0
    else
        echo "⚠️ Namespace '$NAMESPACE' not found. Creating it..."
        kubectl create namespace "$NAMESPACE" || echo "Failed to create namespace"
        return 1
    fi
}

# Function to run compliance scan
run_compliance_scan() {
    local scan_type="$1"
    local config_file="$2"
    local scan_script="$3"
    
    echo ""
    echo "🔍 Running $scan_type Compliance Scan..."
    echo "----------------------------------------"
    
    # Extract and run the scan script
    if kubectl get configmap "${scan_type,,}-compliance-config" -n "$NAMESPACE" &> /dev/null; then
        kubectl get configmap "${scan_type,,}-compliance-config" -n "$NAMESPACE" -o jsonpath="{.data['${scan_script}']}" > "${scan_type,,}-scan.sh"
        chmod +x "${scan_type,,}-scan.sh"
        
        # Run the scan and capture output
        if ./"${scan_type,,}-scan.sh" > "${REPORTS_DIR}/${scan_type,,}-scan-output.log" 2>&1; then
            echo "✅ $scan_type scan completed successfully"
            # Move the generated report to reports directory
            if ls *"${scan_type,,}"*compliance-report*.json 1> /dev/null 2>&1; then
                mv *"${scan_type,,}"*compliance-report*.json "$REPORTS_DIR/"
            fi
        else
            echo "❌ $scan_type scan failed"
            echo "Check ${REPORTS_DIR}/${scan_type,,}-scan-output.log for details"
        fi
        
        # Clean up script
        rm -f "${scan_type,,}-scan.sh"
    else
        echo "⚠️ $scan_type compliance configuration not found. Skipping..."
    fi
}

# Function to generate consolidated report
generate_consolidated_report() {
    echo ""
    echo "📊 Generating Consolidated Compliance Report..."
    echo "----------------------------------------------"
    
    # Initialize consolidated report
    cat > "$CONSOLIDATED_REPORT" << EOF
{
  "scan_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "application": "Banking Application",
  "namespace": "$NAMESPACE",
  "compliance_standards": [],
  "overall_summary": {
    "total_standards": 0,
    "standards_passed": 0,
    "standards_failed": 0,
    "standards_with_warnings": 0,
    "overall_compliance_percentage": 0
  },
  "detailed_results": []
}
EOF
    
    # Process each compliance report
    local total_standards=0
    local standards_passed=0
    local standards_failed=0
    local standards_with_warnings=0
    local total_compliance=0
    
    for report_file in "$REPORTS_DIR"/*compliance-report*.json; do
        if [[ -f "$report_file" ]]; then
            echo "Processing $(basename "$report_file")..."
            
            # Extract standard name from filename
            standard=$(basename "$report_file" | sed 's/-compliance-report.*//' | sed 's/.*\///')
            
            # Read the report
            if jq empty "$report_file" 2>/dev/null; then
                # Extract summary data
                compliance_percentage=$(jq -r '.summary.compliance_percentage // 0' "$report_file")
                passed=$(jq -r '.summary.passed // 0' "$report_file")
                failed=$(jq -r '.summary.failed // 0' "$report_file")
                warnings=$(jq -r '.summary.warnings // 0' "$report_file")
                
                # Add to consolidated report
                jq --arg standard "$standard" \
                   --argjson report "$(cat "$report_file")" \
                   '.compliance_standards += [$standard] | .detailed_results += [$report]' \
                   "$CONSOLIDATED_REPORT" > tmp.json && mv tmp.json "$CONSOLIDATED_REPORT"
                
                # Update counters
                ((total_standards++))
                total_compliance=$((total_compliance + compliance_percentage))
                
                if [[ "$failed" -eq 0 && "$warnings" -le 2 ]]; then
                    ((standards_passed++))
                elif [[ "$failed" -eq 0 ]]; then
                    ((standards_with_warnings++))
                else
                    ((standards_failed++))
                fi
                
                echo "  - $standard: $compliance_percentage% compliance"
            else
                echo "  - $standard: Invalid JSON report"
            fi
        fi
    done
    
    # Calculate overall compliance
    local overall_compliance_percentage=0
    if [[ "$total_standards" -gt 0 ]]; then
        overall_compliance_percentage=$((total_compliance / total_standards))
    fi
    
    # Update consolidated report summary
    jq --arg total "$total_standards" \
       --arg passed "$standards_passed" \
       --arg failed "$standards_failed" \
       --arg warnings "$standards_with_warnings" \
       --arg percentage "$overall_compliance_percentage" \
       '.overall_summary.total_standards = ($total | tonumber) |
        .overall_summary.standards_passed = ($passed | tonumber) |
        .overall_summary.standards_failed = ($failed | tonumber) |
        .overall_summary.standards_with_warnings = ($warnings | tonumber) |
        .overall_summary.overall_compliance_percentage = ($percentage | tonumber)' \
       "$CONSOLIDATED_REPORT" > tmp.json && mv tmp.json "$CONSOLIDATED_REPORT"
    
    echo "✅ Consolidated report generated: $CONSOLIDATED_REPORT"
}

# Function to display summary
display_summary() {
    echo ""
    echo "=================================================================="
    echo "🏦 Comprehensive Compliance Scan Summary"
    echo "=================================================================="
    
    if [[ -f "$CONSOLIDATED_REPORT" ]]; then
        local total_standards=$(jq -r '.overall_summary.total_standards' "$CONSOLIDATED_REPORT")
        local standards_passed=$(jq -r '.overall_summary.standards_passed' "$CONSOLIDATED_REPORT")
        local standards_failed=$(jq -r '.overall_summary.standards_failed' "$CONSOLIDATED_REPORT")
        local standards_with_warnings=$(jq -r '.overall_summary.standards_with_warnings' "$CONSOLIDATED_REPORT")
        local overall_percentage=$(jq -r '.overall_summary.overall_compliance_percentage' "$CONSOLIDATED_REPORT")
        
        echo "📊 Overall Results:"
        echo "  Total Standards Scanned: $total_standards"
        echo "  Standards Passed: $standards_passed"
        echo "  Standards Failed: $standards_failed"
        echo "  Standards with Warnings: $standards_with_warnings"
        echo "  Overall Compliance: $overall_percentage%"
        echo ""
        
        echo "📋 Individual Standard Results:"
        for standard in $(jq -r '.compliance_standards[]' "$CONSOLIDATED_REPORT"); do
            local std_percentage=$(jq -r ".detailed_results[] | select(.standard == \"$standard\" or (.application | contains(\"$standard\"))) | .summary.compliance_percentage" "$CONSOLIDATED_REPORT" 2>/dev/null || echo "N/A")
            echo "  - $standard: $std_percentage%"
        done
        
        echo ""
        echo "📁 Reports Location: $REPORTS_DIR/"
        echo "📄 Consolidated Report: $CONSOLIDATED_REPORT"
        
        # Determine overall status
        if [[ "$standards_failed" -gt 0 ]]; then
            echo ""
            echo "❌ COMPLIANCE SCAN FAILED"
            echo "⚠️  Immediate remediation required for failed standards"
            echo "🚨 Banking operations may be at risk of regulatory penalties"
            exit 1
        elif [[ "$standards_with_warnings" -gt 1 ]]; then
            echo ""
            echo "⚠️ COMPLIANCE SCAN PASSED WITH WARNINGS"
            echo "📋 Please address warnings to ensure full compliance"
            exit 0
        else
            echo ""
            echo "✅ COMPLIANCE SCAN PASSED SUCCESSFULLY"
            echo "🎉 All banking compliance standards met"
            exit 0
        fi
    else
        echo "❌ No consolidated report generated"
        exit 1
    fi
}

# Main execution
main() {
    # Check prerequisites
    if ! command -v jq &> /dev/null; then
        echo "❌ jq is required but not installed. Please install jq to continue."
        exit 1
    fi
    
    # Check Kubernetes availability
    KUBERNETES_AVAILABLE=false
    if check_kubernetes; then
        KUBERNETES_AVAILABLE=true
        check_namespace
    fi
    
    # Run compliance scans
    echo "🔍 Starting compliance scans..."
    
    # PCI-DSS Compliance Scan
    if [[ "$KUBERNETES_AVAILABLE" == "true" ]]; then
        run_compliance_scan "PCI-DSS" "pci-dss-compliance-config" "pci-dss-scan.sh"
    else
        echo "⚠️ Skipping PCI-DSS scan (Kubernetes not available)"
    fi
    
    # SOX Compliance Scan
    if [[ "$KUBERNETES_AVAILABLE" == "true" ]]; then
        run_compliance_scan "SOX" "sox-compliance-config" "sox-scan.sh"
    else
        echo "⚠️ Skipping SOX scan (Kubernetes not available)"
    fi
    
    # GDPR Compliance Scan
    if [[ "$KUBERNETES_AVAILABLE" == "true" ]]; then
        run_compliance_scan "GDPR" "gdpr-compliance-config" "gdpr-scan.sh"
    else
        echo "⚠️ Skipping GDPR scan (Kubernetes not available)"
    fi
    
    # AML Compliance Scan
    if [[ "$KUBERNETES_AVAILABLE" == "true" ]]; then
        run_compliance_scan "AML" "aml-compliance-config" "aml-scan.sh"
    else
        echo "⚠️ Skipping AML scan (Kubernetes not available)"
    fi
    
    # Generate consolidated report
    generate_consolidated_report
    
    # Display summary
    display_summary
}

# Handle script interruption
trap 'echo ""; echo "⚠️ Compliance scan interrupted"; exit 130' INT TERM

# Run main function
main "$@"