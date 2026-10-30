# Deployment and operation

1. [Local development](local-development.md)
2. [Environment variable reference](environment-variables.md)
3. [Supabase and migration setup](supabase-setup.md)
4. [Web, API and Expo deployment](application-deployment.md)
5. [Security, rollback and recovery](security-and-recovery.md)
6. [Troubleshooting](troubleshooting.md)

**Verified:** source/package inspection, Node/npm runtime versions, automated tests and explicitly described read-only resource checks. **Not verified:** a production hosting deployment, a clean remote installation, live staff/patient write workflows, native device/build delivery, Auth email delivery, production backup/restore or security certification. Instructions below are operator procedures to review and execute, not claims they were performed.

Do not deploy or run seeds/migrations automatically. Do not copy service credentials into web/mobile environments. Existing useful implementation deployment notes remain linked from the [architecture index](../architecture/README.md).
