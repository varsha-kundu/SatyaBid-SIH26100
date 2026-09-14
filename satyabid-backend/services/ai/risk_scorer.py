import logging

logger = logging.getLogger(__name__)

class RiskScorer:

    WEIGHTS = {

        "debarred":40,
        "gst_cancelled":25,
        "turnover_failure":20,
        "document_mismatch":15,
        "iso_expired":10,
        "startup_invalid":5
    }

    def calculate(self, findings):

        try:

            if not isinstance(
                findings,
                dict
            ):
                raise ValueError(
                    "findings must be dict"
                )

            score = 100

            deductions = []

            for rule, weight in \
                self.WEIGHTS.items():

                if findings.get(rule):

                    score -= weight

                    deductions.append({

                        "rule":rule,
                        "penalty":weight
                    })

            score = max(0, score)

            return {

                "score": score,
                "risk_level":
                    self._risk_level(
                        score
                ),

                "deductions":
                    deductions
            }

        except Exception as e:

            logger.exception(
                "Risk calculation failure"
            )

            raise

    def _risk_level(
        self,
        score
    ):

        if score >= 85:
            return "LOW"

        if score >= 60:
            return "MEDIUM"

        if score >= 40:
            return "HIGH"

        return "CRITICAL"


risk_scorer = RiskScorer()