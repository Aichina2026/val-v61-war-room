#!/bin/bash
cd /opt/val-nexus
export PYTHONPATH=/opt/val-nexus/backend
exec python3 start_direct.py
