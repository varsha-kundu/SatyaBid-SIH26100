import logging

logger = logging.getLogger(__name__)

class ExplainabilityEngine:

    EXPLANATIONS = {

        "debarred":
        "Vendor found in debarment list",

        "gst_cancelled":
        "GST registration inactive",

        "turnover_failure":
        "Tender turnover requirement not met",

        "document_mismatch":
        "Mismatch between document and portal records",

        "iso_expired":
        "ISO certificate expired",

        "startup_invalid":
        "Startup registration invalid"
    }

    def generate_report(

        self,
        vendor_name,
        findings,
        risk_result

    ):

        logger.info(
            f"Generating report for {vendor_name}"
        )

        report = []

        report.append(
            f"Vendor: {vendor_name}"
        )

        report.append("")

        report.append(
            "=== FINDINGS ==="
        )

        issues = 0

        for key, value in findings.items():

            if value:

                issues += 1

                report.append(

                    f"❌ {self.EXPLANATIONS.get(key,key)}"
                )

        if issues == 0:

            report.append(
                "✅ No discrepancies found"
            )

        report.append("")

        report.append(

            f"Compliance Score: "
            f"{risk_result['score']}/100"
        )

        report.append(

            f"Risk Level: "
            f"{risk_result['risk_level']}"
        )

        return "\n".join(
            report
        )


explainability_engine = \
    ExplainabilityEngine()