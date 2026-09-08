import tempfile
import unittest
from pathlib import Path
from rdrs_agent import AgentConfig, RDRSAgent


class AgentSafetyTests(unittest.TestCase):
    def test_events_outside_configured_folder_are_ignored(self):
        with tempfile.TemporaryDirectory() as root:
            root_path = Path(root)
            config = AgentConfig("http://localhost:3000/api", "test", 1, 1, root_path / "test", root_path / "quarantine")
            agent = RDRSAgent(config)
            config.test_folder.mkdir()
            self.assertIsNone(agent._event("modify", str(root_path / "outside.txt")))

    def test_quarantine_rejects_artifacts_outside_test_folder(self):
        with tempfile.TemporaryDirectory() as root:
            root_path = Path(root)
            config = AgentConfig("http://localhost:3000/api", "test", 1, 1, root_path / "test", root_path / "quarantine")
            agent = RDRSAgent(config)
            with self.assertRaises(ValueError):
                agent.quarantine_test_artifact(str(root_path / "outside.txt"))


if __name__ == "__main__":
    unittest.main()
